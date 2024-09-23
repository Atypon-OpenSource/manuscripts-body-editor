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

import { buildContribution, ObjectTypes } from '@manuscripts/json-schema'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  FigureElementNode,
  FigureNode,
  FootnoteNode,
  generateID,
  generateNodeID,
  GraphicalAbstractSectionNode,
  InlineFootnoteNode,
  isElementNodeType,
  isFootnoteNode,
  isListNode,
  isParagraphNode,
  isSectionNodeType,
  KeywordsNode,
  ListNode,
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptMarkType,
  ManuscriptNode,
  ManuscriptNodeSelection,
  ManuscriptNodeType,
  ManuscriptResolvedPos,
  ManuscriptTextSelection,
  ManuscriptTransaction,
  schema,
  SectionCategory,
  SectionNode,
  SupplementNode,
} from '@manuscripts/transform'
import {
  Attrs,
  Fragment,
  NodeRange,
  NodeType,
  ResolvedPos,
} from 'prosemirror-model'
import { wrapInList } from 'prosemirror-schema-list'
import {
  EditorState,
  NodeSelection,
  Selection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import {
  addColSpan,
  addColumnAfter,
  addColumnBefore,
  addRow,
  CellSelection,
  Rect,
  selectedRect,
  TableMap,
} from 'prosemirror-tables'
import {
  findWrapping,
  liftTarget,
  ReplaceAroundStep,
} from 'prosemirror-transform'
import {
  findChildrenByType,
  findParentNodeOfType,
  hasParentNodeOfType,
  NodeWithPos,
} from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { CommentAttrs, getCommentKey, getCommentRange } from './lib/comments'
import {
  findBackmatter,
  findBibliographySection,
  findBody,
  insertSupplementsNode,
} from './lib/doc'
import { FileAttachment } from './lib/files'
import { getNewFootnotePos } from './lib/footnotes'
import {
  findWordBoundaries,
  isNodeOfType,
  nearestAncestor,
} from './lib/helpers'
import { sectionTitles } from './lib/section-titles'
import { isDeleted, isRejectedInsert } from './lib/track-changes-utils'
import {
  findParentNodeWithId,
  getChildOfType,
  getMatchingChild,
} from './lib/utils'
import { setCommentSelection } from './plugins/comments'
import { getEditorProps } from './plugins/editor-props'
import { footnotesKey } from './plugins/footnotes'
import { checkForCompletion } from './plugins/section_title/autocompletion'
import { EditorAction } from './types'

export type Dispatch = (tr: ManuscriptTransaction) => void

export const markActive =
  (type: ManuscriptMarkType) =>
  (state: ManuscriptEditorState): boolean => {
    const { from, $from, to, empty } = state.selection

    return empty
      ? Boolean(type.isInSet(state.storedMarks || $from.marks()))
      : state.doc.rangeHasMark(from, to, type)
  }

export const isNodeSelection = (
  selection: Selection
): selection is ManuscriptNodeSelection => selection instanceof NodeSelection

export const blockActive =
  (type: ManuscriptNodeType) => (state: ManuscriptEditorState) => {
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

export const canInsert =
  (type: ManuscriptNodeType) => (state: ManuscriptEditorState) => {
    const { $from, $to } = state.selection

    // disable block comment insertion just for title node, LEAN-2746
    if ($from.node().type === schema.nodes.title && $from.pos === $to.pos) {
      return false
    }

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
  dispatch?: Dispatch,
  attrs?: Attrs
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
      ])
      break
    default:
      node = nodeType.createAndFill(attrs)
  }

  const tr = state.tr.insert(position, node as ManuscriptNode)
  if (dispatch) {
    const selection = createSelection(nodeType, position, tr.doc)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }
}

export const insertGeneralFootnote = (
  tableElementNode: ManuscriptNode,
  position: number,
  view: ManuscriptEditorView,
  tableElementFooter?: NodeWithPos[]
) => {
  const { state, dispatch } = view
  const paragraph = state.schema.nodes.paragraph.create({
    placeholder: 'Add general note here',
  })
  const generalNote = state.schema.nodes.general_table_footnote.create({}, [
    paragraph,
  ])
  const tableColGroup = findChildrenByType(
    tableElementNode,
    schema.nodes.table_colgroup
  )[0]
  const table = findChildrenByType(tableElementNode, schema.nodes.table)[0]
  const tr = state.tr
  const pos = tableElementFooter?.length
    ? position + tableElementFooter[0].pos + 2
    : position +
      (!tableColGroup
        ? table.pos + table.node.nodeSize
        : tableColGroup.pos + tableColGroup.node.nodeSize)

  if (tableElementFooter?.length) {
    tr.insert(pos, generalNote as ManuscriptNode)
  } else {
    const tableElementFooter = schema.nodes.table_element_footer.create(
      {
        id: generateID(ObjectTypes.TableElementFooter),
      },
      [generalNote]
    )
    tr.insert(pos, tableElementFooter)
  }

  if (dispatch && pos) {
    const selection = createSelection(state.schema.nodes.paragraph, pos, tr.doc)
    view?.focus()
    dispatch(tr.setSelection(selection).scrollIntoView())
  }
}

export const insertFigure = (
  file: FileAttachment,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const position = findBlockInsertPosition(state)

  if (position === null || !dispatch) {
    return false
  }
  const figure = state.schema.nodes.figure.createAndFill({
    label: file.name,
    src: file.id,
  }) as FigureNode

  const element = state.schema.nodes.figure_element.createAndFill({}, [
    figure,
    state.schema.nodes.figcaption.create({}, [
      state.schema.nodes.caption_title.create(),
      state.schema.nodes.caption.create(),
    ]),
  ]) as FigureElementNode
  const tr = state.tr.insert(position, element)
  dispatch(tr)
  return true
}

export const insertTable = (
  config: TableConfig,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const pos = findBlockInsertPosition(state)
  if (!pos) {
    return false
  }
  const node = createAndFillTableElement(state, config)
  const tr = state.tr.insert(pos, node)
  tr.setSelection(NodeSelection.create(tr.doc, pos)).scrollIntoView()
  dispatch && dispatch(tr)
  return true
}

export const insertSupplement = (
  file: FileAttachment,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const supplement = schema.nodes.supplement.createAndFill({
    id: generateNodeID(schema.nodes.supplement),
    href: file.id,
  }) as SupplementNode

  const tr = state.tr
  const supplements = insertSupplementsNode(tr)
  const pos = supplements.pos + supplements.node.nodeSize - 1
  tr.insert(pos, supplement)
  if (dispatch) {
    dispatch(skipTracking(tr))
  }
  return true
}

export const insertBlock =
  (nodeType: ManuscriptNodeType) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const position = findBlockInsertPosition(state)
    if (position === null) {
      return false
    }

    createBlock(nodeType, position, state, dispatch, undefined)

    return true
  }

export const deleteBlock =
  (typeToDelete: string) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
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

export const findPosBeforeFirstSubsection = (
  $pos: ManuscriptResolvedPos
): number | null => {
  let posBeforeFirstSubsection: number | null = null

  for (let d = $pos.depth; d >= 0; d--) {
    const parentNode = $pos.node(d)
    if (isSectionNodeType(parentNode.type)) {
      const parentStartPos = $pos.start(d) // Get the start position of the parent section
      parentNode.descendants((node, pos) => {
        if (
          node.type === schema.nodes.section &&
          posBeforeFirstSubsection === null
        ) {
          // Found the first subsection, set the position before it
          posBeforeFirstSubsection = parentStartPos + pos
        }
        return posBeforeFirstSubsection === null
      })
      break // Stop iterating after finding the parent section
    }
  }

  return posBeforeFirstSubsection
}

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

const isLink = (text: string): boolean => /^\s*(https?:\S+)/.test(text)

export const insertLink = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const tr = state.tr
  const selection = state.selection

  if (!selection.empty) {
    const text = selectedText()
    const attrs = {
      href: isLink(text) ? text.trim() : '',
    }
    const range = new NodeRange(
      selection.$from,
      selection.$to,
      selection.$from.depth
    )
    const wrapping = findWrapping(range, schema.nodes.link, attrs)

    if (wrapping) {
      tr.wrap(range, wrapping)
    }
  } else {
    tr.insert(state.selection.anchor, schema.nodes.link.create())
  }

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, state.tr.selection.from)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertInlineCitation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const node = state.schema.nodes.citation.create({
    id: generateID(ObjectTypes.Citation),
    rids: [],
    selectedText: selectedText(),
  })

  const pos = state.selection.to

  const { tr } = state

  tr.insert(pos, node)

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
    rids: [],
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
  const sourcePos = state.selection.from - 1

  const tr = state.tr.replaceSelectionWith(
    state.schema.nodes.inline_equation.create({
      format: 'tex',
      contents: selectedText().replace(/^\$/, '').replace(/\$$/, ''),
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

export const createFootnote = (
  state: ManuscriptEditorState,
  kind: 'footnote' | 'endnote'
) => {
  return state.schema.nodes.footnote.createAndFill({
    id: generateID(ObjectTypes.Footnote),
    kind,
  }) as FootnoteNode
}

export const insertFootnote = (
  state: ManuscriptEditorState,
  tr: Transaction,
  footnote: FootnoteNode
) => {
  const footnotesSection = findChildrenByType(
    tr.doc,
    schema.nodes.footnotes_section
  )[0]

  let selectionPos = 0

  const findFootnotePos = (node: ManuscriptNode) => {
    let footnotePos = 0
    node.descendants((n, pos) => {
      if (isFootnoteNode(n)) {
        footnotePos = pos
        n.descendants((childNode, childPos) => {
          if (isParagraphNode(childNode)) {
            footnotePos += childPos
          }
        })
      }
    })
    return footnotePos
  }

  if (!footnotesSection) {
    // create a new footnotes section if needed
    const section = state.schema.nodes.footnotes_section.create({}, [
      state.schema.nodes.section_title.create(
        {},
        state.schema.text('Footnotes')
      ),
      state.schema.nodes.footnotes_element.create({}, footnote),
    ])

    const backmatter = findChildrenByType(tr.doc, schema.nodes.backmatter)[0]
    const sectionPos = backmatter.pos + 1

    tr.insert(sectionPos, section)

    selectionPos = sectionPos + findFootnotePos(section)
  } else {
    // Look for footnote element inside the footnotes section to exclude tables footnote elements
    const footnoteElement = findChildrenByType(
      footnotesSection.node,
      schema.nodes.footnotes_element
    ).pop()

    if (footnoteElement) {
      if (isDeleted(footnoteElement.node)) {
        const footnoteElementPos =
          footnotesSection.pos + findFootnotePos(footnotesSection.node)

        //Restore the deleted footnote element by clearing the 'dataTracked' attribute (setting it to null)
        const updatedAttrs = {
          ...footnoteElement.node.attrs,
          dataTracked: null,
        }
        tr.setNodeMarkup(
          footnoteElementPos,
          undefined,
          updatedAttrs,
          footnoteElement.node.marks
        )
      }
      const pos =
        footnotesSection.pos +
        footnoteElement.pos +
        footnoteElement.node.nodeSize -
        1
      tr.insert(pos, footnote)
      selectionPos = pos + 2
    } else {
      const footnoteElement = schema.nodes.footnotes_element.create(
        {},
        footnote
      )
      const pos = footnotesSection.pos + footnotesSection.node.nodeSize - 1
      tr.insert(pos, footnoteElement)
      selectionPos = pos + 2
    }
  }
  if (selectionPos) {
    const selection = TextSelection.near(tr.doc.resolve(selectionPos))
    tr.setSelection(selection).scrollIntoView()
  }
  return tr
}

export const insertInlineFootnote =
  (kind: 'footnote' | 'endnote') =>
  (state: ManuscriptEditorState, dispatch?: Dispatch) => {
    const fnState = footnotesKey.getState(state)
    const hasUnusedNodes = fnState && fnState.unusedFootnotes.size > 0
    const footnote: FootnoteNode | null = !hasUnusedNodes
      ? createFootnote(state, kind)
      : null

    const insertedAt = state.selection.to
    let tr = state.tr

    const node = state.schema.nodes.inline_footnote.create({
      rids: footnote ? [footnote.attrs.id] : [],
    }) as InlineFootnoteNode

    tr.insert(insertedAt, node)

    if (footnote) {
      tr = insertFootnote(state, tr, footnote)
    }
    if (dispatch) {
      dispatch(tr)
    }
    return true
  }

export const insertGraphicalAbstract = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  // check if another graphical abstract already exists
  // parameter 'deep' must equal true to search the whole document
  if (
    getChildOfType(state.doc, schema.nodes.graphical_abstract_section, true)
  ) {
    return false
  }
  const abstracts = findChildrenByType(state.doc, schema.nodes.abstracts)[0]

  // Insert Graphical abstract at the end of abstracts section
  const pos = abstracts.pos + abstracts.node.content.size + 1
  const section = schema.nodes.graphical_abstract_section.createAndFill(
    { category: 'MPSectionCategory:abstract-graphical' },
    [
      schema.nodes.section_title.create({}, schema.text('Graphical Abstract')),
      createAndFillFigureElement(state),
    ]
  ) as GraphicalAbstractSectionNode

  const tr = state.tr.insert(pos, section)

  if (dispatch) {
    // place cursor inside section title
    const selection = TextSelection.create(tr.doc, pos + 1)
    if (view) {
      view.focus()
    }
    dispatch(tr.setSelection(selection).scrollIntoView())
  }
  return true
}

export const insertSection =
  (subsection = false) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const selection = state.selection
    if (hasParentNodeOfType(schema.nodes.bibliography_section)(selection)) {
      return false
    }

    let pos
    if (hasParentNodeOfType(schema.nodes.body)(selection) || subsection) {
      // Looking for the position to insert the section
      pos = subsection
        ? findPosBeforeFirstSubsection(state.selection.$from) ||
          findPosAfterParentSection(state.selection.$from)
        : findPosAfterParentSection(state.selection.$from)
    } else {
      const body = findBody(state.doc)
      pos = body.pos + body.node.content.size + 1
    }

    if (!pos) {
      return false
    }

    const section = schema.nodes.section.createAndFill() as SectionNode
    const diff = subsection ? -1 : 0 // move pos inside section for a subsection
    const tr = state.tr.insert(pos + diff, section)

    if (dispatch) {
      // place cursor inside section title
      const selection = TextSelection.create(tr.doc, pos + diff + 2)
      view?.focus()
      dispatch(tr.setSelection(selection).scrollIntoView())
    }

    return true
  }

export const insertBackMatterSection =
  (category: SectionCategory) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const backmatter = findBackmatter(state.doc)

    const sections = findChildrenByType(backmatter.node, schema.nodes.section)
    // Check if the section already exists
    if (sections.some((s) => s.node.attrs.category === category)) {
      return false
    }

    // check if reference node exist to insert before it.
    const bibliography = findBibliographySection(state.doc)

    let pos
    if (bibliography) {
      pos = bibliography.pos
    } else {
      pos = backmatter.pos + backmatter.node.content.size + 1
    }

    const node = schema.nodes.section.createAndFill(
      {
        category,
      },
      [
        schema.nodes.section_title.create(
          {},
          schema.text(sectionTitles.get(category) || '')
        ),
      ]
    ) as SectionNode

    const tr = state.tr.insert(pos, node)
    if (dispatch) {
      // place cursor inside section title
      const selection = TextSelection.create(tr.doc, pos)
      view?.focus()
      dispatch(tr.setSelection(selection).scrollIntoView())
    }

    return true
  }

const findSelectedList = (selection: Selection) =>
  (selection instanceof NodeSelection &&
    selection.node.type === schema.nodes.list && {
      pos: selection.from,
      node: selection.node,
    }) ||
  findParentNodeOfType([schema.nodes.list])(selection)

export const insertAbstract = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  if (
    getMatchingChild(
      state.doc,
      (node) => node.attrs.category === 'MPSectionCategory:abstract',
      true
    )
  ) {
    return false
  }
  const abstracts = findChildrenByType(state.doc, schema.nodes.abstracts)[0]
  // Insert abstract at the top of abstracts section
  const pos = abstracts.pos + 1
  const section = schema.nodes.section.createAndFill(
    { category: 'MPSectionCategory:abstract' },
    [
      schema.nodes.section_title.create({}, schema.text('Abstract')),
      schema.nodes.paragraph.create({ placeholder: 'Type abstract here...' }),
    ]
  ) as ManuscriptNode

  const tr = state.tr.insert(pos, section)

  if (dispatch) {
    // Find the start position of the newly inserted section
    const sectionStart = tr.doc.resolve(pos)

    const sectionNode = sectionStart.nodeAfter

    if (sectionNode && sectionNode.firstChild) {
      // Calculate the position for the cursor within the paragraph node
      const paragraphPos = pos + sectionNode.firstChild.nodeSize + 2 // Adjusted calculation

      // Place cursor inside the paragraph element
      const selection = TextSelection.create(tr.doc, paragraphPos)

      if (view) {
        // Focus the editor view before setting the selection
        view.focus()
      }

      dispatch(tr.setSelection(selection).scrollIntoView())
    }
  }
  return true
}

export const insertContributors = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  // Check if another contributors node already exists
  if (getChildOfType(state.doc, schema.nodes.contributors, true)) {
    return false
  }

  // Find the title node
  const title = findChildrenByType(state.doc, state.schema.nodes.title)[0]

  const pos = title.pos + title.node.nodeSize

  const contributors = state.schema.nodes.contributors.create({
    id: '',
  })
  const affiliations = state.schema.nodes.affiliations.create({ id: '' })

  const fragment = Fragment.fromArray([contributors, affiliations])

  const tr = state.tr.insert(pos, fragment)

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    if (view) {
      view.focus()
    }
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertKeywords = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  // Check if another keywords node already exists
  if (getChildOfType(state.doc, schema.nodes.keywords, true)) {
    return false
  }

  // determine the position to insert the keywords node
  const supplements = findChildrenByType(
    state.doc,
    state.schema.nodes.supplements
  )[0]
  const abstracts = findChildrenByType(
    state.doc,
    state.schema.nodes.abstracts
  )[0]
  let pos
  if (supplements) {
    pos = supplements.pos + supplements.node.nodeSize
  } else {
    pos = abstracts.pos
  }
  const keywords = schema.nodes.keywords.createAndFill({}, [
    schema.nodes.section_title.create({}, schema.text('Keywords')),
    schema.nodes.keywords_element.create({}, [
      schema.nodes.keyword_group.create({}, []),
    ]),
  ]) as KeywordsNode

  const tr = state.tr.insert(pos, keywords)

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    if (view) {
      view.focus()
    }
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

const findRootList = ($pos: ResolvedPos) => {
  for (let i = 0; i < $pos.depth; i++) {
    const node = $pos.node(i)
    if (isListNode(node)) {
      const pos = $pos.start(i)
      return {
        node,
        pos,
      }
    }
  }
}

//Somewhat expensive logic, should this be in a plugin?
const findListsAtSameLevel = (doc: ManuscriptNode, list: NodeWithPos) => {
  const $pos = doc.resolve(list.pos + 1)
  // find the top-level list. This is an optimization to
  // avoid traversing the entire document looking for lists
  const root = findRootList($pos)
  if (!root) {
    return [list]
  }
  const target = $pos.depth
  const lists: NodeWithPos[] = []
  root.node.descendants((node, pos) => {
    const $pos = doc.resolve(root.pos + pos + 1)
    if ($pos.depth === target && isListNode(node)) {
      lists.push({ node, pos: $pos.before(target) })
    }
    return $pos.depth <= target
  })
  return lists
}

function toggleOffList(
  state: EditorState,
  dispatch: (tr: ManuscriptTransaction) => void
) {
  const {
    selection: { $from },
    tr,
  } = state

  let rootList = findRootList($from)

  if (
    state.selection instanceof NodeSelection &&
    state.selection.node.type === schema.nodes.list
  ) {
    rootList = {
      pos: state.selection.from,
      node: state.selection.node as ListNode,
    }
  }

  if (rootList) {
    state.doc.nodesBetween(
      rootList.pos,
      rootList.pos + rootList.node.nodeSize,
      (node, pos) => {
        const $fromPos = tr.doc.resolve(tr.mapping.map(pos))
        const $toPos = tr.doc.resolve(tr.mapping.map(pos + node.nodeSize - 1))
        const nodeRange = $fromPos.blockRange($toPos)
        if (!nodeRange) {
          return
        }

        const targetLiftDepth = liftTarget(nodeRange)
        if (targetLiftDepth || targetLiftDepth === 0) {
          tr.lift(nodeRange, targetLiftDepth)
        }
      }
    )
    dispatch(skipTracking(tr))
    return true
  } else {
    return false
  }
}

export const insertList =
  (type: ManuscriptNodeType, style?: string) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const list = findSelectedList(state.selection)

    if (list) {
      if (!dispatch) {
        return true
      }

      if (list.node.attrs.listStyleType === style) {
        return toggleOffList(state, dispatch)
      }

      // list was found: update the type and style
      // of every list at the same level
      const nodes = findListsAtSameLevel(state.doc, list)
      const tr = state.tr
      for (const { node, pos } of nodes) {
        tr.setNodeMarkup(
          pos,
          type,
          {
            ...node.attrs,
            listStyleType: style,
          },
          node.marks
        )
      }
      dispatch(tr)
      return true
    } else {
      // no list found, create new list
      const { selection } = state
      let tr = state.tr
      const startPosition = selection.$from.pos + 1

      return wrapInList(type, { listStyleType: style })(state, (tempTr) => {
        // if we dispatch all steps in this transaction track-changes-plugin will not be able to revert ReplaceAroundStep
        // as we have another ReplaceStep that will make transaction more complicated, so to make it easy to tracker we dispatch first ReplaceAroundStep
        // then will dispatch reminder steps in one transaction
        const range = selection.$from.blockRange(selection.$to)
        if (range && dispatch) {
          tempTr.steps.map((step) => {
            if (step instanceof ReplaceAroundStep) {
              dispatch(tr.step(step))
              tr = view?.state.tr || tr
            } else {
              tr.step(step)
            }
          })
          if (startPosition) {
            const selection = createSelection(
              state.schema.nodes.paragraph,
              startPosition,
              tr.doc
            )
            view?.focus()
            tr.setSelection(selection)
          }

          dispatch(tr)
        }
      })
    }
  }

export const insertBibliographySection = () => {
  return false
}

export const insertTOCSection = () => {
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

export const ignoreMetaNodeBackspaceCommand = (
  state: ManuscriptEditorState
) => {
  const { selection } = state

  if (!isNodeSelection(selection)) {
    return false
  }

  return (
    selection.node.type === schema.nodes.keyword_group ||
    selection.node.type === schema.nodes.keyword ||
    selection.node.type === schema.nodes.affiliations ||
    selection.node.type === schema.nodes.affiliation ||
    selection.node.type === schema.nodes.contributors ||
    selection.node.type === schema.nodes.contributor
  )
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

export type TableConfig = {
  numberOfColumns: number
  numberOfRows: number
  includeHeader: boolean
}

const DEFAULT_TABLE_CONFIG: TableConfig = {
  numberOfColumns: 2,
  numberOfRows: 2,
  includeHeader: true,
}

/**
 * Create a table containing a configurable number of rows and columns.
 * The table can optionally include a header row.
 */
export const createAndFillTableElement = (
  state: ManuscriptEditorState,
  config = DEFAULT_TABLE_CONFIG
) => {
  const { numberOfColumns, numberOfRows, includeHeader } = config
  const createRow = (cellType: ManuscriptNodeType) => {
    const cells = Array.from({ length: numberOfColumns }, () =>
      cellType.create()
    )
    return schema.nodes.table_row.create({}, cells)
  }

  const tableRows = includeHeader ? [createRow(schema.nodes.table_header)] : []

  for (let i = 0; i < numberOfRows; i++) {
    tableRows.push(createRow(schema.nodes.table_cell))
  }

  return schema.nodes.table_element.createChecked({}, [
    createAndFillFigcaptionElement(state),
    schema.nodes.table.create({}, tableRows),
    schema.nodes.listing.create(),
  ])
}

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

/**
 * This to make sure we get block node
 */
const getParentNode = (selection: Selection) => {
  const parentNode = findParentNodeWithId(selection)
  const node = parentNode?.node

  if (node?.type === schema.nodes.table) {
    return findParentNodeOfType(schema.nodes.table_element)(selection)?.node
  }

  return node
}

// TODO:: remove this check when we allow all type of block node to have comment
const isCommentingAllowed = (type: NodeType) =>
  type === schema.nodes.title ||
  type === schema.nodes.section ||
  type === schema.nodes.citation ||
  type === schema.nodes.bibliography_item ||
  type === schema.nodes.footnotes_section ||
  type === schema.nodes.bibliography_section ||
  type === schema.nodes.graphical_abstract_section ||
  type === schema.nodes.keyword_group ||
  type === schema.nodes.paragraph ||
  type === schema.nodes.figure_element ||
  type === schema.nodes.table_element

export const addNodeComment = (
  node: ManuscriptNode,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  if (!isCommentingAllowed(node.type)) {
    return false
  }

  const props = getEditorProps(state)
  const contribution = buildContribution(props.userID)
  const attrs = {
    id: generateID(ObjectTypes.CommentAnnotation),
    contents: '',
    target: node.attrs.id,
    contributions: [contribution],
  } as CommentAttrs
  const comment = schema.nodes.comment.create(attrs)
  const comments = findChildrenByType(state.doc, schema.nodes.comments)[0]
  if (comments) {
    const pos = comments.pos + 1

    const tr = state.tr.insert(pos, comment)
    const key = getCommentKey(attrs, undefined, node)
    setCommentSelection(tr, key, attrs.id, true)
    if (dispatch) {
      dispatch(tr)
    }
    return true
  }
  return false
}

export const addInlineComment = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
): boolean => {
  const selection = state.selection
  const node = getParentNode(selection)
  if (!node || !isCommentingAllowed(node.type)) {
    return false
  }
  let from = selection.from
  let to = selection.to

  const props = getEditorProps(state)
  const contribution = buildContribution(props.userID)
  const attrs = {
    id: generateID(ObjectTypes.CommentAnnotation),
    contents: '',
    target: node.attrs.id,
    contributions: [contribution],
    originalText: selectedText(),
    selector: {
      from,
      to,
    },
  } as CommentAttrs
  const comment = schema.nodes.comment.create(attrs)
  const comments = findChildrenByType(state.doc, schema.nodes.comments)[0]
  if (comments) {
    const pos = comments.pos + 1

    const tr = state.tr.insert(pos, comment)

    if (from === to) {
      // Use the current cursor position to determine the boundaries of the intended word
      const result = findWordBoundaries(state, from)
      from = result.from
      to = result.to
    }

    const start = schema.nodes.highlight_marker.create({
      id: comment.attrs.id,
      tid: node.attrs.id,
      position: 'start',
    })
    const end = schema.nodes.highlight_marker.create({
      id: comment.attrs.id,
      tid: node.attrs.id,
      position: 'end',
    })
    tr.insert(from, start).insert(to + 1, end)

    const range = getCommentRange(attrs)
    const key = getCommentKey(attrs, range, node)
    setCommentSelection(tr, key, attrs.id, true)
    if (dispatch) {
      dispatch(tr)
    }
    return true
  }
  return false
}

interface NodeWithPosition {
  node: InlineFootnoteNode
  pos: number
}

export const insertTableFootnote = (
  tableElementNode: ManuscriptNode,
  position: number,
  view: EditorView,
  inlineFootnote?: NodeWithPosition
) => {
  const { state, dispatch } = view
  const tr = state.tr

  const footnote = state.schema.nodes.footnote.createAndFill({
    id: generateID(ObjectTypes.Footnote),
    kind: 'footnote',
  }) as FootnoteNode

  const insertedAt = state.selection.to

  let footnoteIndex
  if (inlineFootnote) {
    const contents = inlineFootnote.node.attrs.contents.split(',').map(Number)
    footnoteIndex = Math.max(...contents) + 1
    tr.setNodeMarkup(inlineFootnote.pos, undefined, {
      rids: [...inlineFootnote.node.attrs.rids, footnote.attrs.id],
      contents: inlineFootnote.node.attrs.contents + ',' + footnoteIndex,
    })
  } else {
    const inlineFootnotes = findChildrenByType(
      tableElementNode,
      schema.nodes.inline_footnote
    )
    footnoteIndex =
      inlineFootnotes.filter(
        ({ pos }) =>
          !isRejectedInsert(tableElementNode) && position + pos <= insertedAt
      ).length + 1
    const inlineFootnoteNode = state.schema.nodes.inline_footnote.create({
      rids: [footnote.attrs.id],
      contents: footnoteIndex === -1 ? inlineFootnotes.length : footnoteIndex,
    }) as InlineFootnoteNode

    // insert the inline footnote
    tr.insert(insertedAt, inlineFootnoteNode)
  }

  let insertionPos = position

  const footnotesElement = findChildrenByType(
    tableElementNode,
    schema.nodes.footnotes_element
  ).pop()

  if (
    footnotesElement &&
    !isDeleted(footnotesElement.node) &&
    !isRejectedInsert(footnotesElement.node)
  ) {
    const footnotePos = getNewFootnotePos(footnotesElement, footnoteIndex)
    insertionPos = tr.mapping.map(position + footnotePos)

    tr.insert(insertionPos, footnote)
  } else {
    const footnoteElement = state.schema.nodes.footnotes_element.create(
      {},
      footnote
    )

    const tableElementFooter = findChildrenByType(
      tableElementNode,
      schema.nodes.table_element_footer
    )[0]

    if (tableElementFooter) {
      const pos = tableElementFooter.pos
      insertionPos = position + pos + tableElementFooter.node.nodeSize
      tr.insert(tr.mapping.map(insertionPos), footnoteElement)
    } else {
      const tableElementFooter = schema.nodes.table_element_footer.create(
        {
          id: generateID(ObjectTypes.TableElementFooter),
        },
        [footnoteElement]
      )

      const tableColGroup = findChildrenByType(
        tableElementNode,
        schema.nodes.table_colgroup
      )[0]
      const table = findChildrenByType(tableElementNode, schema.nodes.table)[0]
      if (tableColGroup) {
        insertionPos =
          position + tableColGroup.pos + tableColGroup.node.nodeSize
        tr.insert(tr.mapping.map(insertionPos), tableElementFooter)
      } else {
        insertionPos = position + table.pos + table.node.nodeSize
        tr.insert(tr.mapping.map(insertionPos), tableElementFooter)
      }
    }
  }

  dispatch(tr)

  const textSelection = TextSelection.near(
    view.state.tr.doc.resolve(insertionPos + 1)
  )
  view.focus()
  dispatch(view.state.tr.setSelection(textSelection).scrollIntoView())
}

export const addRows =
  (direction: 'top' | 'bottom') =>
  (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (dispatch) {
      const { tr } = state
      const rect = selectedRect(state)
      const selectedRows = rect.bottom - rect.top
      for (let i = 0; i < selectedRows; i++) {
        addRow(tr, rect, rect[direction])
      }
      dispatch(tr)
    }
    return true
  }

export const addColumns =
  (direction: 'right' | 'left') =>
  (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (dispatch) {
      const { tr } = state
      const rect = selectedRect(state.apply(tr))
      const selectedRows = rect.right - rect.left
      for (let i = 0; i < selectedRows; i++) {
        const command = direction === 'right' ? addColumnAfter : addColumnBefore
        command(state.apply(tr), (t) => t.steps.map((s) => tr.step(s)))
      }
      dispatch(tr)
    }
    return true
  }

function isEmpty(cell: ManuscriptNode): boolean {
  const c = cell.content

  return (
    c.childCount == 1 && c.child(0).isTextblock && c.child(0).childCount == 0
  )
}

function cellsOverlapRectangle({ width, height, map }: TableMap, rect: Rect) {
  let indexTop = rect.top * width + rect.left,
    indexLeft = indexTop
  let indexBottom = (rect.bottom - 1) * width + rect.left,
    indexRight = indexTop + (rect.right - rect.left - 1)
  for (let i = rect.top; i < rect.bottom; i++) {
    if (
      (rect.left > 0 && map[indexLeft] == map[indexLeft - 1]) ||
      (rect.right < width && map[indexRight] == map[indexRight + 1])
    ) {
      return true
    }
    indexLeft += width
    indexRight += width
  }
  for (let i = rect.left; i < rect.right; i++) {
    if (
      (rect.top > 0 && map[indexTop] == map[indexTop - width]) ||
      (rect.bottom < height && map[indexBottom] == map[indexBottom + width])
    ) {
      return true
    }
    indexTop++
    indexBottom++
  }
  return false
}

// This command was brought from: https://github.com/ProseMirror/prosemirror-tables
// and tweaked to add space between cells when they get merged
// we can use the original command when table cell content is block not inline, as with that content for each cell will be in a paragraph
export function mergeCellsWithSpace(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const sel = state.selection
  if (
    !(sel instanceof CellSelection) ||
    sel.$anchorCell.pos == sel.$headCell.pos
  ) {
    return false
  }
  const rect = selectedRect(state),
    { map } = rect
  if (cellsOverlapRectangle(map, rect)) {
    return false
  }
  if (dispatch) {
    const tr = state.tr
    const seen: Record<number, boolean> = {}
    let content = Fragment.empty
    let mergedPos: number | undefined
    let mergedCell: ManuscriptNode | undefined
    for (let row = rect.top; row < rect.bottom; row++) {
      for (let col = rect.left; col < rect.right; col++) {
        const cellPos = map.map[row * map.width + col]
        const cell = rect.table.nodeAt(cellPos)
        if (seen[cellPos] || !cell) {
          continue
        }
        seen[cellPos] = true
        if (mergedPos == null) {
          mergedPos = cellPos
          mergedCell = cell
        } else {
          if (!isEmpty(cell)) {
            content = content.append(
              cell.content.addToStart(cell.type.schema.text(' '))
            )
          }
          const mapped = tr.mapping.map(cellPos + rect.tableStart)
          tr.delete(mapped, mapped + cell.nodeSize)
        }
      }
    }
    if (mergedPos == null || mergedCell == null) {
      return true
    }

    tr.setNodeMarkup(mergedPos + rect.tableStart, null, {
      ...addColSpan(
        mergedCell.attrs as never,
        mergedCell.attrs.colspan,
        rect.right - rect.left - mergedCell.attrs.colspan
      ),
      rowspan: rect.bottom - rect.top,
    })
    if (content.size) {
      const end = mergedPos + 1 + mergedCell.content.size
      const start = isEmpty(mergedCell) ? mergedPos + 1 : end
      tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content)
    }
    tr.setSelection(
      new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart))
    )
    dispatch(tr)
  }
  return true
}

export const autoComplete = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const complete = checkForCompletion(state)
  if (complete) {
    const tr = state.tr.insertText(complete.suggestion, state.selection.from)
    const inserted = complete.title.substring(
      0,
      complete.title.length - complete.suggestion.length
    )
    if (inserted) {
      // replacing to provide text case as required
      tr.replaceWith(
        state.selection.from - inserted.length,
        state.selection.from,
        schema.text(inserted)
      )
    }

    dispatch && dispatch(tr)
    return true
  }
  return false
}
