import { MarkType, ResolvedPos } from 'prosemirror-model'
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import { getChildOfType } from './lib/utils'
import { INSERT, modelsKey } from './plugins/models'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeSelection,
  ManuscriptNodeType,
  ManuscriptTextSelection,
  ManuscriptTransaction,
} from './schema/types'
import {
  buildCitation,
  buildFootnote,
  buildInlineMathFragment,
} from './transformer/builders'
import { isElementNode } from './transformer/node-types'
import { EditorAction } from './types'

export type Dispatch = (tr: ManuscriptTransaction) => void

export const markActive = (type: MarkType) => (
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

  if (to > $from.end()) return false

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

    if (isElementNode(node)) {
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
  if (nodeType.isAtom) {
    return NodeSelection.create(doc, position)
  }

  return TextSelection.near(doc.resolve(position + 1))
}

export const createBlock = (
  nodeType: ManuscriptNodeType,
  position: number,
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const node = (nodeType === state.schema.nodes.table_element
    ? createAndFillTableElement(state)
    : nodeType.createAndFill()) as ManuscriptNode

  const tr = state.tr.insert(position, node)

  if (dispatch) {
    dispatch(
      tr
        .setSelection(createSelection(nodeType, position, tr.doc))
        .scrollIntoView()
    )
  }
}

export const insertBlock = (nodeType: ManuscriptNodeType) => (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const position = findBlockInsertPosition(state)

  if (position === null) return false

  createBlock(nodeType, position, state, dispatch)

  return true
}

export const insertBreak: EditorAction = (state, dispatch) => {
  const br = state.schema.nodes.hard_break.create()

  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(br).scrollIntoView())
  }

  return true
}

const selectedText = () => window.getSelection().toString()

export const insertInlineCitation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const citation = buildCitation(state.selection.$anchor.parent.attrs.id, [])

  const node = state.schema.nodes.citation.create({
    rid: citation._id,
    selectedText: selectedText(),
  })

  const pos = state.selection.to

  const tr = state.tr
    .setMeta(modelsKey, { [INSERT]: [citation] })
    .insert(pos, node)

  if (dispatch) {
    dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)))
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
    dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)))
  }

  return true
}

export const insertInlineEquation = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const inlineMathFragment = buildInlineMathFragment(
    state.selection.$anchor.parent.attrs.id,
    selectedText()
      .replace(/^\$/, '')
      .replace(/\$$/, '')
  )

  const tr = state.tr
    .setMeta(modelsKey, { [INSERT]: [inlineMathFragment] })
    .replaceSelectionWith(state.schema.nodes.inline_equation.create())

  if (dispatch) {
    dispatch(
      tr.setSelection(NodeSelection.create(tr.doc, state.tr.selection.from))
    )
  }

  return true
}

export const insertInlineFootnote = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const footnote = buildFootnote(
    state.selection.$anchor.parent.attrs.id,
    window.getSelection().toString()
  )

  const node = state.schema.nodes.inline_footnote.create()

  const pos = state.selection.to

  const tr = state.tr
    .setMeta(modelsKey, { [INSERT]: [footnote] })
    .insert(pos, node)

  if (dispatch) {
    dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)))
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
  ]) as ManuscriptNode

  if (dispatch) {
    dispatch(
      state.tr.insert(state.tr.doc.content.size, section).scrollIntoView()
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
    if ($head.node(d).type === state.schema.nodes.tbody_row) {
      return command(state)
    }
  }

  return false
}

// Copied from prosemirror-commands
const findCutBefore = ($pos: ResolvedPos) => {
  if (!$pos.parent.type.spec.isolating) {
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) return $pos.doc.resolve($pos.before(i + 1))
      if ($pos.node(i).type.spec.isolating) break
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

  if (!isTextSelection(selection)) return false

  const { $cursor } = selection

  if (!$cursor) return false

  // ignore empty blocks
  if ($cursor.parent.content.size === 0) return false

  // handle cursor at start of textblock
  if (!isAtStartOfTextBlock(state, $cursor, view)) {
    return false
  }

  const $cut = findCutBefore($cursor)

  if (!$cut) return false

  const node = $cut.nodeBefore

  if (!node) return false

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
      if (parent.type.spec.isolating) break
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

  if (!isTextSelection(selection)) return false

  const { $cursor } = selection

  if (!$cursor) return false

  // ignore empty blocks
  if ($cursor.parent.content.size === 0) return false

  // handle cursor at start of textblock
  if (!isAtEndOfTextBlock(state, $cursor, view)) {
    return false
  }

  const $cut = findCutAfter($cursor)

  if (!$cut) return false

  const node = $cut.nodeAfter

  if (!node) return false

  return node.isBlock && node.isAtom
}

const selectIsolatingParent = (
  state: ManuscriptEditorState
): TextSelection | null => {
  const { $anchor } = state.selection

  for (let d = $anchor.depth; d >= 0; d--) {
    const node = $anchor.node(d)

    if (node.type.spec.isolating) {
      return TextSelection.create(state.doc, $anchor.start(d), $anchor.end(d))
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

  if (!selection) return false

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
    state.schema.nodes.table.create({}, [
      state.schema.nodes.thead_row.create({}, [
        state.schema.nodes.table_cell.create(),
        state.schema.nodes.table_cell.create(),
      ]),
      state.schema.nodes.tbody_row.create({}, [
        state.schema.nodes.table_cell.create(),
        state.schema.nodes.table_cell.create(),
      ]),
      state.schema.nodes.tbody_row.create({}, [
        state.schema.nodes.table_cell.create(),
        state.schema.nodes.table_cell.create(),
      ]),
      state.schema.nodes.tfoot_row.create({}, [
        state.schema.nodes.table_cell.create(),
        state.schema.nodes.table_cell.create(),
      ]),
    ]),
    state.schema.nodes.figcaption.create(),
  ])
