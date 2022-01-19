/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  BibliographySectionNode,
  buildCitation,
  buildHighlight,
  buildInlineMathFragment,
  FootnoteNode,
  FootnotesElementNode,
  FootnotesSectionNode,
  generateID,
  InlineFootnoteNode,
  isElementNodeType,
  isSectionNodeType,
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptMarkType,
  ManuscriptNode,
  ManuscriptNodeSelection,
  ManuscriptNodeType,
  ManuscriptResolvedPos,
  ManuscriptTextSelection,
  ManuscriptTransaction,
  SectionNode,
  TOCSectionNode,
} from '@manuscripts/manuscript-transform'
import { ExternalFile, ObjectTypes } from '@manuscripts/manuscripts-json-schema'
import {
  commands as trackPluginCommands,
  getTrackPluginState,
} from '@manuscripts/track-changes'
import { ResolvedPos } from 'prosemirror-model'
import {
  NodeSelection,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { v4 as uuid } from 'uuid'

import { ANNOTATION_COLOR } from './lib/annotations'
import { isNodeOfType, nearestAncestor } from './lib/helpers'
import { getChildOfType } from './lib/utils'
import { bibliographyKey } from './plugins/bibliography'
import { footnotesKey } from './plugins/footnotes'
import * as footnotesUtils from './plugins/footnotes/footnotes-utils'
import {
  getHighlights,
  highlightKey,
  SET_COMMENT_TARGET,
} from './plugins/highlight'
import { keywordsKey } from './plugins/keywords'
import { INSERT, modelsKey } from './plugins/models'
// import { tocKey } from './plugins/toc'
import { EditorAction } from './types'

export type Dispatch = (tr: ManuscriptTransaction) => void

export const markActive = (type: ManuscriptMarkType) => (
  state: ManuscriptEditorState
): boolean => {
  const { from, $from, to, empty } = state.selection

  return empty
    ? Boolean(type.isInSet(state.storedMarks || $from.marks()))
    : state.doc.rangeHasMark(from, to, type)
}

export const isNodeSelection = (
  selection: Selection
): selection is ManuscriptNodeSelection => selection instanceof NodeSelection

export const blockActive = (type: ManuscriptNodeType) => (
  state: ManuscriptEditorState
) => {
  const { selection } = state

  if (isNodeSelection(selection)) {
    return selection.node.type === type
  }

  const { to, $from } = selection as ManuscriptTextSelection

  if (to > $from.end()) {
    return false
  }

  for (let d = $from.depth; d >= 0; d--) {
    const ancestor = $from.node(d)

    // only look at the closest parent with an id
    if (ancestor.attrs.id) {
      return ancestor.type === type
    }
  }

  return false
}

export const canInsert = (type: ManuscriptNodeType) => (
  state: ManuscriptEditorState
) => {
  const { $from } = state.selection

  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d)

    if ($from.node(d).canReplaceWith(index, index, type)) {
      return true
    }
  }

  return false
}

const findBlockInsertPosition = (state: ManuscriptEditorState) => {
  const { $from } = state.selection

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d)

    if (isElementNodeType(node.type)) {
      return $from.after(d)
    }
  }

  return null
}

export const createSelection = (
  nodeType: ManuscriptNodeType,
  position: number,
  doc: ManuscriptNode
) => {
  const { nodes } = nodeType.schema

  switch (nodeType) {
    case nodes.figure_element:
      // select the figure caption
      return TextSelection.near(doc.resolve(position + 5), 1)

    case nodes.listing_element:
      // select the listing
      return NodeSelection.create(doc, position + 1)

    default:
      return nodeType.isAtom
        ? NodeSelection.create(doc, position)
        : TextSelection.near(doc.resolve(position + 1))
  }
}

export const createBlock = (
  nodeType: ManuscriptNodeType,
  position: number,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  let node

  switch (nodeType) {
    case state.schema.nodes.table_element:
      node = createAndFillTableElement(state)
      break
    case state.schema.nodes.figure_element:
      node = createAndFillFigureElement(state)
      break
    case state.schema.nodes.listing_element:
      node = state.schema.nodes.listing_element.create({}, [
        state.schema.nodes.listing.create(),
        createAndFillFigcaptionElement(state),
      ])
      break
    case state.schema.nodes.equation_element:
      node = state.schema.nodes.equation_element.create({}, [
        state.schema.nodes.equation.create(),
        createAndFillFigcaptionElement(state),
      ])
      break
    case state.schema.nodes.paragraph:
      node = state.schema.nodes.paragraph.create({}, [
        state.schema.nodes.fragment.create(),
      ])
      break
    default:
      node = nodeType.createAndFill()
  }

  const tr = state.tr.insert(position, node as ManuscriptNode)

  if (dispatch) {
    const selection = createSelection(nodeType, position, tr.doc)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }
}

export const insertFileAsFigure = (
  file: ExternalFile,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const position = findBlockInsertPosition(state)

  if (position === null || !dispatch) {
    return false
  }
  const node = state.schema.nodes.figure.createAndFill({
    label: file.displayName,
    src: file.publicUrl,
    embedURL: { default: undefined },
    originalURL: { default: undefined },
    externalFileReferences: [
      {
        url: file.publicUrl,
        kind: 'imageRepresentation',
      },
    ],
  })
  const tr = state.tr.insert(position, node as ManuscriptNode)
  dispatch(tr)
  return true
}
export const insertBlock = (nodeType: ManuscriptNodeType) => (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const position = findBlockInsertPosition(state)

  if (position === null) {
    return false
  }

  createBlock(nodeType, position, state, dispatch)

  return true
}

export const deleteBlock = (typeToDelete: string) => (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const { selection, tr } = state
  const { $head } = selection
  const depth = nearestAncestor(isNodeOfType(typeToDelete))($head)

  if (!depth) {
    return false
  }

  if (dispatch) {
    const start = $head.start(depth)
    const end = $head.end(depth)
    tr.delete(start - 1, end + 1)
    dispatch(tr)
  }

  return true
}

export const insertBreak: EditorAction = (state, dispatch) => {
  const br = state.schema.nodes.hard_break.create()

  const tr = state.tr.replaceSelectionWith(br)

  if (dispatch) {
    dispatch(tr.scrollIntoView())
  }

  return true
}

const selectedText = (): string => (window.getSelection() || '').toString()

const findPosAfterParentSection = (
  $pos: ManuscriptResolvedPos
): number | null => {
  for (let d = $pos.depth; d >= 0; d--) {
    const node = $pos.node(d)

    if (isSectionNodeType(node.type)) {
      return $pos.after(d)
    }
  }

  return null
}

const findParentSectionStartPosition = (
  $pos: ManuscriptResolvedPos
): number | null => {
  for (let d = $pos.depth; d >= 0; d--) {
    const node = $pos.node(d)

    if (isSectionNodeType(node.type)) {
      return $pos.start(d)
    }
  }

  return null
}

export const insertSectionLabel = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  currentTr?: Transaction
) => {
  const pos = findParentSectionStartPosition(state.selection.$from)
  if (pos === null) {
    return false
  }
  const node = state.schema.nodes.section_label.create(
    {},
    state.schema.text('Label')
  )
  const tr = (currentTr || state.tr).insert(pos, node)
  if (dispatch) {
    // place cursor inside section title
    // const selection = TextSelection.create(tr.doc, pos + 2)
    dispatch(tr)
  }

  return true
}

export const insertLink = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const text = selectedText()
  const contents = text ? state.schema.text(text) : undefined
  const matches = text.match(/^\s*(https?:\S+)/)
  const attrs = {
    href: matches ? matches[1] : '',
  }
  const node = state.schema.nodes.link.create(attrs, contents)

  const tr = state.tr.replaceSelectionWith(node)

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, state.tr.selection.from)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

const needsBibliography = (state: ManuscriptEditorState) =>
  !bibliographyKey.getState(state).citations.length &&
  !getChildOfType(state.tr.doc, state.schema.nodes.bibliography_section)

const createBibliographySection = (state: ManuscriptEditorState) =>
  state.schema.nodes.bibliography_section.createAndFill(
    {},
    state.schema.nodes.section_title.create(
      {},
      state.schema.text('Bibliography')
    )
  ) as ManuscriptNode

export const insertInlineCitation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: ManuscriptEditorView,
  embeddedCitationItems: string[] = []
) => {
  const citation = buildCitation(
    state.selection.$anchor.parent.attrs.id,
    embeddedCitationItems
  )

  const node = state.schema.nodes.citation.create({
    rid: citation._id,
    selectedText: selectedText(),
  })

  const pos = state.selection.to

  const { tr } = state

  tr.setMeta(modelsKey, { [INSERT]: [citation] }).insert(pos, node)

  if (needsBibliography(state)) {
    tr.insert(
      tr.doc.content.size,
      createBibliographySection(state)
    ).setMeta(bibliographyKey, { bibliographyInserted: true })
  }

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertCrossReference = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const node = state.schema.nodes.cross_reference.create({
    rid: null,
  })

  const pos = state.selection.to

  const tr = state.tr.insert(pos, node)

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertInlineEquation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const inlineMathFragment = buildInlineMathFragment(
    state.selection.$anchor.parent.attrs.id,
    selectedText().replace(/^\$/, '').replace(/\$$/, '')
  )

  const sourcePos = state.selection.from - 1

  const tr = state.tr
    .setMeta(modelsKey, { [INSERT]: [inlineMathFragment] })
    .replaceSelectionWith(
      state.schema.nodes.inline_equation.create({
        id: inlineMathFragment._id,
      })
    )

  if (dispatch) {
    const selection = NodeSelection.create(
      tr.doc,
      tr.mapping.map(sourcePos) + 1
    )
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertInlineFootnote = (kind: 'footnote' | 'endnote') => (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const footnote = state.schema.nodes.footnote.createAndFill({
    id: generateID(ObjectTypes.Footnote),
    kind,
  }) as FootnoteNode

  const insertedAt = state.selection.to
  const thisFootnoteNumbering = footnotesUtils.getNewFootnoteNumbering(
    insertedAt,
    state
  )

  const inlineFootnote = state.schema.nodes.inline_footnote.create({
    rid: footnote.attrs.id,
    contents: thisFootnoteNumbering.toString(),
  }) as InlineFootnoteNode

  const tr = state.tr

  // insert the inline footnote, referencing the footnote in the footnotes element in the footnotes section
  tr.insert(insertedAt, inlineFootnote)

  const footnotesElementAndPos = footnotesUtils.findFootnotesElement(tr.doc)

  let selectionPos: number

  if (footnotesElementAndPos === undefined) {
    // create a new footnotes section if needed
    const footnotesSection = state.schema.nodes.footnotes_section.create({}, [
      state.schema.nodes.section_title.create({}, state.schema.text('Notes')),
      state.schema.nodes.footnotes_element.create(
        {},
        footnote
      ) as FootnotesElementNode,
    ]) as FootnotesSectionNode

    const insideEndPos = tr.doc.content.size

    // TODO: insert bibliography section before footnotes section
    tr.insert(insideEndPos, footnotesSection)
    // inside footnote inside element inside section
    selectionPos = insideEndPos + footnotesSection.nodeSize
  } else {
    const [footnotePos, selectPos] = footnotesUtils.getNewFootnoteElementPos(
      footnotesElementAndPos,
      thisFootnoteNumbering
    )
    tr.insert(footnotePos, footnote)
    selectionPos = selectPos
  }

  if (dispatch) {
    // set selection inside new footnote
    const selection = TextSelection.create(tr.doc, selectionPos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertKeywordsSection = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  // TODO: use SectionCategory for title and to enforce uniqueness

  if (getChildOfType(state.doc, state.schema.nodes.keywords_section)) {
    return false
  }

  const section = state.schema.nodes.keywords_section.createAndFill({}, [
    state.schema.nodes.section_title.create({}, state.schema.text('Keywords')),
  ]) as BibliographySectionNode

  const pos = 0

  const tr = state.tr

  tr.insert(pos, section).setMeta(keywordsKey, { keywordsInserted: true })

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertSection = (subsection = false) => (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const pos = findPosAfterParentSection(state.selection.$from)

  if (pos === null) {
    return false
  }

  const adjustment = subsection ? -1 : 0 // move pos inside section for a subsection

  const tr = state.tr.insert(
    pos + adjustment,
    state.schema.nodes.section.createAndFill() as SectionNode
  )

  if (dispatch) {
    // place cursor inside section title
    const selection = TextSelection.create(tr.doc, pos + adjustment + 2)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertFootnotesSection = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  if (getChildOfType(state.doc, state.schema.nodes.footnotes_section)) {
    return false
  }

  const section = state.schema.nodes.footnotes_section.createAndFill({}, [
    state.schema.nodes.section_title.create({}, state.schema.text('Notes')),
    state.schema.nodes.footnotes_element.create(),
  ]) as BibliographySectionNode

  const pos = state.tr.doc.content.size

  const tr = state.tr

  tr.insert(pos, section).setMeta(footnotesKey, {
    footnotesElementInserted: true,
  })

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertBibliographySection = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  if (getChildOfType(state.doc, state.schema.nodes.bibliography_section)) {
    return false
  }

  const section = state.schema.nodes.bibliography_section.createAndFill({}, [
    state.schema.nodes.section_title.create(
      {},
      state.schema.text('Bibliography')
    ),
  ]) as BibliographySectionNode

  const pos = state.tr.doc.content.size

  const tr = state.tr

  tr.insert(pos, section).setMeta(bibliographyKey, {
    bibliographyInserted: true,
  })

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertTOCSection = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  if (getChildOfType(state.doc, state.schema.nodes.toc_section)) {
    return false
  }

  const section = state.schema.nodes.toc_section.createAndFill({}, [
    state.schema.nodes.section_title.create(
      {},
      state.schema.text('Table of Contents')
    ),
  ]) as TOCSectionNode

  const pos = 0

  const tr = state.tr.insert(
    pos,
    section
  ) /*.setMeta(tocKey, {
    tocInserted: true,
  })*/

  if (dispatch) {
    dispatch(
      tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()
    )
  }

  return true
}

/**
 * Call the callback (a prosemirror-tables command) if the current selection is in the table body
 */
export const ifInTableBody = (
  command: (state: ManuscriptEditorState) => boolean
) => (state: ManuscriptEditorState): boolean => {
  const $head = state.selection.$head

  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d)

    if (node.type === state.schema.nodes.table_row) {
      const table = $head.node(d - 1)

      if (table.firstChild === node || table.lastChild === node) {
        return false
      }

      return command(state)
    }
  }

  return false
}

// Copied from prosemirror-commands
const findCutBefore = ($pos: ResolvedPos) => {
  if (!$pos.parent.type.spec.isolating) {
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) {
        return $pos.doc.resolve($pos.before(i + 1))
      }
      if ($pos.node(i).type.spec.isolating) {
        break
      }
    }
  }
  return null
}

export const isAtStartOfTextBlock = (
  state: ManuscriptEditorState,
  $cursor: ResolvedPos,
  view?: ManuscriptEditorView
) => (view ? view.endOfTextblock('backward', state) : $cursor.parentOffset <= 0)

export const isTextSelection = (
  selection: Selection
): selection is ManuscriptTextSelection => selection instanceof TextSelection

// Ignore atom blocks (as backspace handler), instead of deleting them.
// Adapted from selectNodeBackward in prosemirror-commands
export const ignoreAtomBlockNodeBackward = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: ManuscriptEditorView
): boolean => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }

  const { $cursor } = selection

  if (!$cursor) {
    return false
  }

  // ignore empty blocks
  if ($cursor.parent.content.size === 0) {
    return false
  }

  // handle cursor at start of textblock
  if (!isAtStartOfTextBlock(state, $cursor, view)) {
    return false
  }

  const $cut = findCutBefore($cursor)

  if (!$cut) {
    return false
  }

  const node = $cut.nodeBefore

  if (!node) {
    return false
  }

  return node.isBlock && node.isAtom
}

// Copied from prosemirror-commands
const findCutAfter = ($pos: ResolvedPos) => {
  if (!$pos.parent.type.spec.isolating) {
    for (let i = $pos.depth - 1; i >= 0; i--) {
      const parent = $pos.node(i)
      if ($pos.index(i) + 1 < parent.childCount) {
        return $pos.doc.resolve($pos.after(i + 1))
      }
      if (parent.type.spec.isolating) {
        break
      }
    }
  }
  return null
}

export const isAtEndOfTextBlock = (
  state: ManuscriptEditorState,
  $cursor: ResolvedPos,
  view?: ManuscriptEditorView
) =>
  view
    ? view.endOfTextblock('forward', state)
    : $cursor.parentOffset >= $cursor.parent.content.size

// Ignore atom blocks (as delete handler), instead of deleting them.
// Adapted from selectNodeForward in prosemirror-commands
export const ignoreAtomBlockNodeForward = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: ManuscriptEditorView
): boolean => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }

  const { $cursor } = selection

  if (!$cursor) {
    return false
  }

  // ignore empty blocks
  if ($cursor.parent.content.size === 0) {
    return false
  }

  // handle cursor at start of textblock
  if (!isAtEndOfTextBlock(state, $cursor, view)) {
    return false
  }

  const $cut = findCutAfter($cursor)

  if (!$cut) {
    return false
  }

  const node = $cut.nodeAfter

  if (!node) {
    return false
  }

  return node.isBlock && node.isAtom
}

const selectIsolatingParent = (
  state: ManuscriptEditorState
): TextSelection | null => {
  const { $anchor } = state.selection

  for (let d = $anchor.depth; d >= 0; d--) {
    const node = $anchor.node(d)

    if (node.type.spec.isolating) {
      return TextSelection.create(
        state.tr.doc,
        $anchor.start(d),
        $anchor.end(d)
      )
    }
  }

  return null
}

/**
 * "Select All" the contents of an isolating block instead of the whole document
 */
export const selectAllIsolating = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
): boolean => {
  const selection = selectIsolatingParent(state)

  if (!selection) {
    return false
  }

  if (dispatch) {
    dispatch(state.tr.setSelection(selection))
  }

  return true
}

/**
 * Create a figure containing a 2x2 table with header and footer and a figcaption
 */
export const createAndFillTableElement = (state: ManuscriptEditorState) =>
  state.schema.nodes.table_element.create({}, [
    state.schema.nodes.table.create(
      {},
      Array.from([1, 2, 3, 4], () =>
        state.schema.nodes.table_row.create({}, [
          state.schema.nodes.table_cell.create(),
          state.schema.nodes.table_cell.create(),
        ])
      )
    ),
    createAndFillFigcaptionElement(state),
    state.schema.nodes.listing.create(),
  ])

const createAndFillFigureElement = (state: ManuscriptEditorState) =>
  state.schema.nodes.figure_element.create({}, [
    state.schema.nodes.figure.create({}, [
      state.schema.nodes.figcaption.create(),
    ]),
    createAndFillFigcaptionElement(state),
    state.schema.nodes.listing.create(),
  ])

const createAndFillFigcaptionElement = (state: ManuscriptEditorState) =>
  state.schema.nodes.figcaption.create({}, [
    state.schema.nodes.caption_title.create(),
    state.schema.nodes.caption.create(),
  ])

export const insertAnnotation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
): boolean => {
  const isTrackEnabled = !!getTrackPluginState(state)
  if (isTrackEnabled) {
    const id = uuid()
    const color = `rgb(${ANNOTATION_COLOR.join(', ')})`
    return trackPluginCommands.addAnnotation(id, color)(state, dispatch)
  }

  return false
}

export const insertHighlight = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
): boolean => {
  const isTrackEnabled = !!getTrackPluginState(state)
  if (isTrackEnabled) {
    const id = uuid()
    const color = `rgb(${ANNOTATION_COLOR.join(', ')})`
    return trackPluginCommands.addAnnotation(id, color)(state, dispatch)
  }

  const highlight = buildHighlight()

  const { from, to } = state.selection

  const text = state.doc.textBetween(from, to, '\n')

  const fromNode = state.schema.nodes.highlight_marker.create({
    rid: highlight._id,
    position: 'start',
    text,
  })

  const toNode = state.schema.nodes.highlight_marker.create({
    rid: highlight._id,
    position: 'end',
  })

  const tr = state.tr
    .setMeta(modelsKey, { [INSERT]: [highlight] })
    .insert(from, fromNode)
    .insert(to + 1, toNode)
    .setMeta(highlightKey, { [SET_COMMENT_TARGET]: highlight._id })

  tr.setMeta('addToHistory', false)

  if (dispatch) {
    dispatch(tr)
  }

  return true
}

export const deleteHighlightMarkers = (
  rid: string,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const markersToDelete: number[] = []

  // TODO: work through the doc instead of using the plugin positions?

  const highlights = getHighlights(state)

  for (const highlight of highlights) {
    if (highlight.rid === rid) {
      if (highlight.start !== undefined) {
        markersToDelete.push(highlight.start - 1)
      }

      if (highlight.end !== undefined) {
        markersToDelete.push(highlight.end)
      }
    }
  }

  if (markersToDelete.length) {
    const { tr } = state

    // delete markers last first
    markersToDelete.sort((a, b) => b - a)

    for (const pos of markersToDelete) {
      tr.delete(pos, pos + 1)
    }

    tr.setMeta('addToHistory', false)

    if (dispatch) {
      dispatch(tr)
    }
  }
}
