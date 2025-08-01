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

import { buildContribution } from '@manuscripts/json-schema'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  AttachmentNode,
  AwardNode,
  BoxElementNode,
  FigureElementNode,
  FigureNode,
  FootnotesElementNode,
  generateNodeID,
  GraphicalAbstractSectionNode,
  isElementNodeType,
  isListNode,
  isSectionNodeType,
  isTableElementNode,
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
  Slice,
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
  addColumnAfter,
  addColumnBefore,
  addRow,
  selectedRect,
} from 'prosemirror-tables'
import {
  findWrapping,
  liftTarget,
  ReplaceAroundStep,
  ReplaceStep,
} from 'prosemirror-transform'
import {
  findChildrenByType,
  findParentNodeOfType,
  findParentNodeOfTypeClosestToPos,
  flatten,
  hasParentNodeOfType,
  NodeWithPos,
} from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { CommentAttrs, getCommentKey, getCommentRange } from './lib/comments'
import {
  findAbstractsNode,
  findBackmatter,
  findBibliographySection,
  findBody,
  findFootnotesSection,
  insertAttachmentsNode,
  insertAwardsNode,
  insertFootnotesSection,
  insertSupplementsNode,
} from './lib/doc'
import { FileAttachment } from './lib/files'
import {
  createFootnote,
  findFootnotesContainerNode,
  getFootnotesElementState,
} from './lib/footnotes'
import {
  findWordBoundaries,
  isNodeOfType,
  nearestAncestor,
} from './lib/helpers'
import { isDeleted } from './lib/track-changes-utils'
import {
  findParentNodeWithId,
  getChildOfType,
  getInsertPos,
  getLastTitleNode,
  isBodyLocked,
} from './lib/utils'
import { expandAccessibilitySection } from './plugins/accessibility_element'
import { setCommentSelection } from './plugins/comments'
import { getEditorProps } from './plugins/editor-props'
import { searchReplaceKey } from './plugins/search-replace'
import { checkForCompletion } from './plugins/section_title/autocompletion'
import { EditorAction } from './types'

export type Dispatch = (tr: ManuscriptTransaction) => void

// enter at the start of paragraph will add node above
export const addToStart = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
): boolean => {
  const { selection } = state

  const props = getEditorProps(state)
  if (props.getCapabilities().editWithoutTracking) {
    return false
  }

  if (
    !dispatch ||
    !(selection instanceof TextSelection) ||
    (selection.$from.node().type !== schema.nodes.paragraph &&
      selection.$from.node().type !== schema.nodes.text_block)
  ) {
    return false
  }

  const {
    $anchor: { parentOffset: startOffset },
    $head: { parentOffset: endOffset },
    $from,
    $to,
  } = selection

  // Check if the cursor is at the start of a paragraph or text block.
  // This ensures that a new node is added above the current node only when
  // the cursor is at the very beginning of the parent node.
  if (startOffset === 0 && endOffset === 0) {
    const side =
      (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to)
        .pos - (startOffset === 0 ? 1 : 0)

    const tr = state.tr
    const from = $from.node().type.createAndFill()
    if (from) {
      tr.insert(side, from)
      dispatch(tr.scrollIntoView())
      return true
    }
  }
  return false
}

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
    if (
      ($from.node().type === schema.nodes.title ||
        $from.node().type === schema.nodes.section_title) &&
      $from.pos === $to.pos &&
      type !== schema.nodes.text
    ) {
      return false
    }

    if (
      isElementNodeType(type) &&
      type !== schema.nodes.paragraph &&
      findParentNodeOfType(schema.nodes.backmatter)(state.selection)
    ) {
      return false
    }

    if (type === schema.nodes.table_element) {
      if (findParentNodeOfType(schema.nodes.list_item)(state.selection)) {
        return false
      }
    }

    // Prevent inserting a box_element if:
    //  it's not inside a body node (invalid context), OR
    //  it's already nested inside another box_element (disallowed nesting)
    if (
      type === schema.nodes.box_element &&
      (!hasParentNodeOfType(schema.nodes.body)(state.selection) ||
        hasParentNodeOfType(schema.nodes.box_element)(state.selection))
    ) {
      return false
    }

    const initDepth =
      findParentNodeOfType(schema.nodes.box_element)(state.selection)?.depth ||
      0

    for (let d = $from.depth; d >= initDepth; d--) {
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
  let node: ManuscriptNode
  switch (nodeType) {
    case schema.nodes.table_element:
      node = createAndFillTableElement(attrs)
      break
    case schema.nodes.figure_element:
      node = createAndFillFigureElement(attrs)
      break
    case schema.nodes.image_element:
      node = createImageElement(attrs)
      break
    case schema.nodes.hero_image:
      node = createHeroImage(attrs)
      break
    case schema.nodes.listing_element:
      node = schema.nodes.listing_element.create({}, [
        schema.nodes.listing.create(),
        createAndFillFigcaptionElement(),
      ])
      break
    case schema.nodes.equation_element:
      node = schema.nodes.equation_element.create({}, [
        schema.nodes.equation.create(),
      ])
      break
    case schema.nodes.embed:
      node = createEmbedElement(attrs)
      break
    case state.schema.nodes.pullquote_element:
      node = state.schema.nodes.pullquote_element.create(attrs, [
        state.schema.nodes.paragraph.create({}),
        state.schema.nodes.attribution.create({}),
      ])
      break
    default:
      node = nodeType.createAndFill(attrs) as ManuscriptNode
  }

  const tr = state.tr.insert(position, node)

  if (dispatch) {
    const selection = createSelection(nodeType, position, tr.doc)
    expandAccessibilitySection(tr, node)
    dispatch(tr.setSelection(selection).scrollIntoView())
  }
}

export const insertEmbed = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  attrs?: Attrs
) => {
  const position = findBlockInsertPosition(state)
  if (position === null) {
    return false
  }

  createBlock(schema.nodes.embed, position, state, dispatch, attrs)

  return true
}

export const insertInlineTableFootnote = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const $pos = state.selection.$to
  const table = findParentNodeOfTypeClosestToPos($pos, schema.nodes.table)
  if (!table) {
    return false
  }
  if (!dispatch) {
    return true
  }
  return insertInlineFootnote(state, dispatch)
}

export const insertGeneralTableFootnote = (
  element: [ManuscriptNode, number],
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const existing = findChildrenByType(
    element[0],
    schema.nodes.general_table_footnote
  )
  if (existing.length) {
    return false
  }
  if (!dispatch) {
    return true
  }

  const tr = state.tr
  const footer = insertTableElementFooter(tr, element)

  const pos = footer.pos + 2
  const node = schema.nodes.general_table_footnote.create({}, [
    schema.nodes.paragraph.create(),
  ])
  tr.insert(pos, node)
  const selection = TextSelection.create(tr.doc, pos + 1)
  tr.setSelection(selection).scrollIntoView()
  dispatch(tr)
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
  const node = createAndFillTableElement(undefined, config)
  const tr = state.tr.insert(pos, node)
  expandAccessibilitySection(tr, node)
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

export const insertAttachment = (
  file: FileAttachment,
  state: ManuscriptEditorState,
  type: string,
  dispatch?: Dispatch
) => {
  const tr = state.tr
  const attachments = insertAttachmentsNode(tr)
  if (!attachments) {
    return false
  }

  if (attachments.node.childCount > 0) {
    const startPos = attachments.pos + 1
    const endPos = attachments.pos + attachments.node.nodeSize - 1
    tr.delete(startPos, endPos)
  }

  const attachment = schema.nodes.attachment.createAndFill({
    id: generateNodeID(schema.nodes.attachment),
    href: file.id,
    type: type,
  }) as AttachmentNode

  tr.insert(attachments.pos + 1, attachment)

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
      parentNode.descendants((node, pos, parent) => {
        // Only consider direct children of the section
        if (
          node.type === schema.nodes.section &&
          parent === parentNode &&
          posBeforeFirstSubsection === null
        ) {
          // Found the first subsection, set the position before it
          posBeforeFirstSubsection = parentStartPos + pos
        }
        // Stop descending if we've found the position
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
  const node = schema.nodes.citation.create({
    id: generateNodeID(schema.nodes.citation),
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

export const insertTableElementFooter = (
  tr: Transaction,
  table: [ManuscriptNode, number]
) => {
  const footer = findChildrenByType(
    table[0],
    schema.nodes.table_element_footer
  )[0]
  if (footer) {
    const pos = tr.mapping.map(table[1] + footer.pos)
    if (isDeleted(footer.node)) {
      reinstateNode(tr, footer.node, pos)
    }
    return {
      node: footer.node,
      pos,
    }
  }
  const pos = tr.mapping.map(
    getInsertPos(schema.nodes.table_element_footer, table[0], table[1])
  )
  const node = schema.nodes.table_element_footer.create()
  tr.insert(pos, node)
  return {
    node,
    pos,
  }
}

export const insertFootnotesElement = (
  tr: Transaction,
  container: [ManuscriptNode, number]
) => {
  let pos
  const node = schema.nodes.footnotes_element.create()
  if (isTableElementNode(container[0])) {
    //table footnote
    const footer = insertTableElementFooter(tr, container)
    pos = footer.pos + footer.node.nodeSize - 1
  } else {
    //regular footnote
    const section = insertFootnotesSection(tr)
    pos = section.pos + section.node.nodeSize - 1
    tr.insert(pos, node)
  }
  return [node, pos] as [FootnotesElementNode, number]
}

export const insertInlineFootnote = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const pos = state.selection.to
  const tr = state.tr
  const container = findFootnotesContainerNode(state.doc, pos)
  const fn = getFootnotesElementState(state, container.node.attrs.id)
  const hasFootnotes =
    fn && fn.footnotes.filter((fn) => !isDeleted(fn[0])).length > 0

  const footnote = !hasFootnotes && createFootnote()
  const node = schema.nodes.inline_footnote.create({
    rids: footnote ? [footnote.attrs.id] : [],
  })

  tr.insert(pos, node)

  if (footnote) {
    let element: [FootnotesElementNode, number]
    if (fn) {
      element = [fn.element[0], tr.mapping.map(fn.element[1])]
    } else {
      element = insertFootnotesElement(tr, [container.node, container.pos])
    }

    if (isDeleted(element[0])) {
      reinstateNode(tr, element[0], element[1])
    }

    const fnPos = element[1] + element[0].nodeSize - 1
    tr.insert(fnPos, footnote)
    const selection = TextSelection.create(tr.doc, fnPos + 2)
    tr.setSelection(selection).scrollIntoView()
  } else {
    const selection = NodeSelection.create(tr.doc, pos)
    tr.setSelection(selection).scrollIntoView()
  }

  if (dispatch) {
    dispatch(tr)
  }
  return true
}

const reinstateNode = (tr: Transaction, node: ManuscriptNode, pos: number) => {
  const attrs = {
    ...node.attrs,
    dataTracked: null,
  }
  tr.setNodeMarkup(pos, null, attrs)
}

export const insertBoxElement = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const selection = state.selection
  const { nodes } = schema

  // Check if the selection is inside the body
  const isBody = hasParentNodeOfType(nodes.body)(selection)
  const isBoxText = hasParentNodeOfType(nodes.box_element)(selection)
  // If selection is not in the body, disable the option
  if (!isBody || isBoxText) {
    return false
  }

  const position = findBlockInsertPosition(state)
  const paragraph = nodes.paragraph.create({})

  // Create a section node with a section title and a paragraph
  const section = nodes.section.createAndFill({}, [
    nodes.section_title.create(),
    paragraph,
  ]) as ManuscriptNode

  // Create the BoxElement node with a figcaption and the section
  const node = nodes.box_element.createAndFill({}, [
    nodes.figcaption.create({}, [nodes.caption_title.create()]),
    section,
  ]) as BoxElementNode

  if (position && dispatch) {
    const tr = state.tr.insert(position, node)
    dispatch(tr)
  }

  return true
}

export const insertSection =
  (subsection = false) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const { nodes } = schema
    const $pos = state.selection.$from

    const isInBibliography = findParentNodeOfTypeClosestToPos(
      $pos,
      nodes.bibliography_section
    )
    const isInBox = findParentNodeOfTypeClosestToPos($pos, nodes.box_element)
    const isInBody = findParentNodeOfTypeClosestToPos($pos, nodes.body)
    const isInMainTitle = findParentNodeOfTypeClosestToPos($pos, nodes.title)

    if (isInMainTitle && isBodyLocked(state)) {
      return false
    }

    // Disallow inserting (sub)sections in bibliography
    if (isInBibliography) {
      return false
    }
    // Only subsections are allowed in box_element
    if (isInBox && !subsection) {
      return false
    }

    let insertPos: number | null = null

    if (subsection) {
      insertPos =
        findPosBeforeFirstSubsection($pos) || findPosAfterParentSection($pos)
      if (!insertPos) {
        return false
      }
      // Move position inside the parent section for the subsection
      insertPos -= 1
    } else {
      if (isInBody) {
        insertPos = findPosAfterParentSection($pos)
      }
    }

    if (insertPos == null) {
      // Insert at the end of the body if:
      // - selection is outside the body
      // - selection is inside the body but not within a section
      const body = findBody(state.doc)
      insertPos = body.pos + body.node.content.size + 1
    }

    const section = nodes.section.createAndFill() as SectionNode
    const tr = state.tr.insert(insertPos, section)

    if (dispatch) {
      const selection = TextSelection.create(tr.doc, insertPos + 2) // Place cursor inside section title
      view?.focus()
      dispatch(tr.setSelection(selection).scrollIntoView())
    }

    return true
  }

export const insertAbstractSection =
  (category: SectionCategory) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const abstracts = findAbstractsNode(state.doc)
    const sections = findChildrenByType(abstracts.node, schema.nodes.section)
    // Check if the section already exists
    if (sections.some((s) => s.node.attrs.category === category.id)) {
      return false
    }

    // check if graphical abstract node exist to insert before it.
    const ga = findChildrenByType(
      state.doc,
      schema.nodes.graphical_abstract_section
    )[0]

    let pos = ga ? ga.pos : abstracts.pos + abstracts.node.content.size + 1
    if (category.id === 'abstract') {
      pos = abstracts.pos + 1
    }

    const node = schema.nodes.section.create({ category: category.id }, [
      schema.nodes.section_title.create({}, schema.text(category.titles[0])),
      schema.nodes.paragraph.create({ placeholder: 'Type abstract here...' }),
    ])

    const tr = state.tr.insert(pos, node)
    if (dispatch) {
      // place cursor inside section title
      const selection = TextSelection.create(tr.doc, pos)
      view?.focus()
      dispatch(tr.setSelection(selection).scrollIntoView())
    }

    return true
  }

export const insertBackmatterSection =
  (category: SectionCategory) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const backmatter = findBackmatter(state.doc)
    const sections = findChildrenByType(backmatter.node, schema.nodes.section)
    // Check if the section already exists
    if (sections.some((s) => s.node.attrs.category === category.id)) {
      return false
    }

    // check if reference node exist to insert before it.
    const bibliography = findBibliographySection(state.doc)

    // check if footnotes node exist to insert before it.
    const footnotesSection = findFootnotesSection(state.doc)

    const pos =
      footnotesSection?.pos ??
      bibliography?.pos ??
      backmatter.pos + backmatter.node.content.size + 1

    const attrs = { category: category.id }
    const node = schema.nodes.section.create(attrs, [
      schema.nodes.section_title.create({}, schema.text(category.titles[0])),
    ])

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

export const insertGraphicalAbstract =
  (category: SectionCategory) =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    const abstracts = findAbstractsNode(state.doc)
    const sections = findChildrenByType(
      abstracts.node,
      schema.nodes.graphical_abstract_section
    )

    // Check if the section already exists
    if (sections.some((s) => s.node.attrs.category === category.id)) {
      return false
    }

    const ga = findChildrenByType(
      state.doc,
      schema.nodes.graphical_abstract_section
    )[0]

    // insert at the end of abstracts section
    let pos = abstracts.pos + abstracts.node.content.size + 1
    // abstract-key-image insert before abstract-graphical
    pos = ga && category.id === 'abstract-key-image' ? ga.pos : pos

    const node = schema.nodes.graphical_abstract_section.createAndFill(
      { category: category.id },
      [
        schema.nodes.section_title.create({}, schema.text(category.titles[0])),
        createAndFillFigureElement(state),
      ]
    ) as GraphicalAbstractSectionNode

    const tr = state.tr.insert(pos, node)
    node.lastChild && expandAccessibilitySection(tr, node.lastChild)
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
  const title = getLastTitleNode(state)
  const pos = title.pos + title.node.nodeSize
  const contributors = state.schema.nodes.contributors.create({
    id: '',
  })

  const tr = state.tr.insert(pos, contributors)

  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    if (view) {
      view.focus()
    }
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertAffiliation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  // Check if another contributors node already exists
  if (getChildOfType(state.doc, schema.nodes.affiliations, true)) {
    return false
  }
  // Find the title node
  const title = getLastTitleNode(state)
  let pos = title.pos + title.node.nodeSize

  // Find the contributors node
  const contributors = findChildrenByType(
    state.doc,
    state.schema.nodes.contributors
  )[0]

  // update the pos if the contributors node exists
  if (contributors) {
    pos = contributors.pos + contributors.node.nodeSize
  }

  const affiliations = state.schema.nodes.affiliations.create({
    id: '',
  })

  const tr = state.tr.insert(pos, affiliations)
  if (dispatch) {
    const selection = NodeSelection.create(tr.doc, pos)
    if (view) {
      view.focus()
    }
    dispatch(tr.setSelection(selection).scrollIntoView())
  }

  return true
}

export const insertAward = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: EditorView
) => {
  const award = schema.nodes.award.create() as AwardNode
  const tr = state.tr
  const awards = insertAwardsNode(tr)
  const pos = awards.pos + awards.node.nodeSize - 1
  tr.insert(pos, award)
  const selection = NodeSelection.create(tr.doc, pos)
  view && view.focus()
  if (dispatch) {
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
        // remove all the nodes that are not fully in the range
        if (
          rootList &&
          (pos < rootList.pos ||
            node.nodeSize > rootList.pos + rootList.node.nodeSize)
        ) {
          return true
        }
        const $fromPos = tr.doc.resolve(tr.mapping.map(pos))
        const $toPos = tr.doc.resolve(tr.mapping.map(pos + node.nodeSize - 1))
        const nodeRange = $fromPos.blockRange($toPos)
        if (!nodeRange) {
          return
        }

        const targetLiftDepth = liftTarget(nodeRange)
        if (targetLiftDepth || targetLiftDepth === 0) {
          tr.lift(nodeRange, targetLiftDepth)
          return false // do not descend as the content of this node will be lifted already anyway
        }
      }
    )
    dispatch(tr)
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
    selection.node.type === schema.nodes.contributor ||
    selection.node.type === schema.nodes.awards ||
    selection.node.type === schema.nodes.award
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
  attrs?: Attrs,
  config = DEFAULT_TABLE_CONFIG
) => {
  const { numberOfColumns, numberOfRows, includeHeader } = config
  const createRow = (cellType: ManuscriptNodeType) => {
    const cells = Array.from({ length: numberOfColumns }, () =>
      cellType.create({}, schema.nodes.text_block.create())
    )
    return schema.nodes.table_row.create({}, cells)
  }

  const tableRows = includeHeader ? [createRow(schema.nodes.table_header)] : []

  for (let i = 0; i < numberOfRows; i++) {
    tableRows.push(createRow(schema.nodes.table_cell))
  }

  return schema.nodes.table_element.createChecked(
    {
      ...attrs,
      id: generateNodeID(schema.nodes.table_element),
    },
    [
      createAndFillFigcaptionElement(),
      schema.nodes.table.create({}, tableRows),
      schema.nodes.alt_text.create(),
      schema.nodes.long_desc.create(),
      schema.nodes.listing.create(),
    ]
  )
}

const createAndFillFigureElement = (attrs?: Attrs) =>
  schema.nodes.figure_element.create(
    {
      ...attrs,
      id: generateNodeID(schema.nodes.figure_element),
    },
    [
      schema.nodes.figure.create({}, [schema.nodes.figcaption.create()]),
      createAndFillFigcaptionElement(),
      schema.nodes.alt_text.create(),
      schema.nodes.long_desc.create(),
      schema.nodes.listing.create(),
    ]
  )

const createAndFillFigcaptionElement = () =>
  schema.nodes.figcaption.create({}, [
    schema.nodes.caption_title.create(),
    schema.nodes.caption.create(),
  ])

const createImageElement = (attrs?: Attrs) =>
  schema.nodes.image_element.create(
    {
      ...attrs,
      id: generateNodeID(schema.nodes.image_element),
    },
    [
      schema.nodes.figure.create(),
      schema.nodes.alt_text.create(),
      schema.nodes.long_desc.create(),
    ]
  )

const createEmbedElement = (attrs?: Attrs) =>
  schema.nodes.embed.create(
    {
      ...attrs,
      id: generateNodeID(schema.nodes.embed),
    },
    [
      createAndFillFigcaptionElement(),
      schema.nodes.alt_text.create(),
      schema.nodes.long_desc.create(),
    ]
  )
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
export const isCommentingAllowed = (type: NodeType) =>
  type === schema.nodes.title ||
  type === schema.nodes.section ||
  type === schema.nodes.citation ||
  type === schema.nodes.bibliography_item ||
  type === schema.nodes.footnotes_section ||
  type === schema.nodes.bibliography_section ||
  type === schema.nodes.box_element ||
  type === schema.nodes.graphical_abstract_section ||
  type === schema.nodes.keyword_group ||
  type === schema.nodes.paragraph ||
  type === schema.nodes.figure_element ||
  type === schema.nodes.list ||
  type === schema.nodes.table_element ||
  type === schema.nodes.embed ||
  type === schema.nodes.affiliations ||
  type === schema.nodes.contributors ||
  type === schema.nodes.image_element ||
  type === schema.nodes.hero_image

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
    id: generateNodeID(schema.nodes.comment),
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

  if (from === to) {
    // Use the current cursor position to determine the boundaries of the intended word
    const result = findWordBoundaries(state, from)
    from = result.from
    to = result.to
  }

  const props = getEditorProps(state)
  const contribution = buildContribution(props.userID)
  const attrs = {
    id: generateNodeID(schema.nodes.comment),
    contents: '',
    target: node.attrs.id,
    contributions: [contribution],
    originalText: selectedText() || state.doc.textBetween(from, to),
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

export const addRows =
  (direction: 'top' | 'bottom') =>
  (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (dispatch) {
      const { tr } = state
      let rect = selectedRect(state)
      const selectedRows = rect.bottom - rect.top
      for (let i = 0; i < selectedRows; i++) {
        addRow(tr, rect, rect[direction])
        // this to make sure next row has tracking attributes, so each step of addRow has a different location
        rect = {
          ...selectedRect(state.apply(tr)),
          top: rect.top + 1,
          bottom: rect.bottom + 1,
        }
      }
      dispatch(tr)
    }
    return true
  }

export const addHeaderRow =
  (direction: 'above' | 'below') =>
  (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (dispatch) {
      const { tr } = state
      const rect = selectedRect(state)
      const addRowStep = addRow(
        state.tr,
        rect,
        rect[direction === 'below' ? 'bottom' : 'top']
      ).steps.pop()
      if (addRowStep && addRowStep instanceof ReplaceStep) {
        const { from, to, slice } = addRowStep
        const cells = flatten(slice.content.firstChild as ManuscriptNode, false)
        const row = schema.nodes.table_row.create(
          undefined,
          cells.map((cell) =>
            schema.nodes.table_header.create(cell.node.attrs, cell.node.content)
          )
        )
        tr.step(
          new ReplaceStep(
            from,
            to,
            new Slice(Fragment.from(row), slice.openStart, slice.openEnd)
          )
        )
        dispatch(tr)
      }
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

export const autoComplete = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const complete = checkForCompletion(state)
  if (complete && complete.suggestion.length > 0) {
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

export const activateSearch = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const pluginState = searchReplaceKey.getState(state)
  const tr = state.tr.setMeta(searchReplaceKey, {
    active: !pluginState?.active,
  })
  dispatch && dispatch(tr)
  return true
}

export const activateSearchReplace = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const pluginState = searchReplaceKey.getState(state)
  const tr = state.tr.setMeta(searchReplaceKey, {
    activeAdvanced: !pluginState?.activeAdvanced,
  })
  dispatch && dispatch(tr)
  return true
}

const createHeroImage = (attrs?: Attrs) =>
  schema.nodes.hero_image.create(
    {
      ...attrs,
      id: generateNodeID(schema.nodes.hero_image),
    },
    [
      schema.nodes.figure.create(),
      schema.nodes.alt_text.create(),
      schema.nodes.long_desc.create(),
    ]
  )

export const insertHeroImage =
  () =>
  (state: ManuscriptEditorState, dispatch?: Dispatch, view?: EditorView) => {
    if (getChildOfType(state.doc, schema.nodes.hero_image, true)) {
      return false
    }
    const backmatter = findBackmatter(state.doc)

    const position = backmatter.pos + backmatter.node.content.size + 1
    view?.focus()
    createBlock(schema.nodes.hero_image, position, state, dispatch)

    return true
  }
