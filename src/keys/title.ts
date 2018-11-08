import { chainCommands } from 'prosemirror-commands'
import { ResolvedPos } from 'prosemirror-model'
import { Selection, TextSelection, Transaction } from 'prosemirror-state'
import {
  isAtEndOfTextBlock,
  isAtStartOfTextBlock,
  isTextSelection,
} from '../commands'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptSchema,
} from '../schema/types'
import { EditorAction } from '../types'

type Dispatch = (transaction: Transaction) => void

const insertParagraph = (
  dispatch: Dispatch,
  state: ManuscriptEditorState,
  $anchor: ResolvedPos
) => {
  const {
    tr,
    schema: { nodes },
  } = state

  const offset = $anchor.nodeAfter ? $anchor.nodeAfter.nodeSize : 0
  const pos = $anchor.pos + offset + 1
  const nextNode = tr.doc.resolve(pos).nodeAfter

  if (
    !nextNode ||
    (nextNode.type !== nodes.paragraph || nextNode.nodeSize > 2)
  ) {
    tr.insert(pos, nodes.paragraph.create())
  }

  tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView()

  dispatch(tr)
}

const enterNextBlock = (
  dispatch: Dispatch,
  state: ManuscriptEditorState,
  $anchor: ResolvedPos,
  create?: boolean
) => {
  const {
    schema: { nodes },
    tr,
  } = state

  const pos = $anchor.after($anchor.depth - 1)

  let selection = Selection.findFrom(tr.doc.resolve(pos), 1, true)

  if (!selection && create) {
    tr.insert(pos, nodes.paragraph.create())
    selection = Selection.findFrom(tr.doc.resolve(pos), 1, true)
  }

  if (!selection) return false

  tr.setSelection(selection).scrollIntoView()

  dispatch(tr)

  return true
}

const enterPreviousBlock = (
  dispatch: Dispatch,
  state: ManuscriptEditorState,
  $anchor: ResolvedPos
) => {
  const { tr } = state

  const offset = $anchor.nodeBefore ? $anchor.nodeBefore.nodeSize : 0
  const $pos = tr.doc.resolve($anchor.pos - offset - 1)
  const previous = Selection.findFrom($pos, -1, true)

  if (!previous) return false

  tr.setSelection(TextSelection.create(tr.doc, previous.from)).scrollIntoView()

  dispatch(tr)

  return true
}

const exitBlock = (direction: number): EditorAction => (state, dispatch) => {
  const {
    selection: { $anchor },
  } = state

  if (dispatch) {
    return direction === 1
      ? enterNextBlock(dispatch, state, $anchor)
      : enterPreviousBlock(dispatch, state, $anchor)
  }
  return true
}

const leaveSectionTitle: EditorAction = (state, dispatch, view) => {
  const {
    selection,
    schema: { nodes },
  } = state

  if (!isTextSelection(selection)) return false

  const { $cursor } = selection

  if (!$cursor) return false

  if ($cursor.parent.type !== nodes.section_title) {
    return false
  }

  if (!isAtEndOfTextBlock(state, $cursor, view)) {
    return false
  }

  if (dispatch) {
    insertParagraph(dispatch, state, $cursor)
  }

  return true
}

const leaveFigcaption: EditorAction = (state, dispatch) => {
  const {
    selection: { $anchor },
    schema: { nodes },
  } = state

  if ($anchor.parent.type !== nodes.figcaption) return false

  if (dispatch) {
    enterNextBlock(dispatch, state, $anchor, true)
  }

  return true
}

// ignore backspace at the start of section titles
const protectSectionTitle: EditorAction = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: ManuscriptEditorView
) => {
  const {
    selection,
    schema: { nodes },
  } = state

  if (!isTextSelection(selection)) return false

  const { $cursor } = selection

  if (!$cursor) return false

  return (
    $cursor.parent.type === nodes.section_title &&
    isAtStartOfTextBlock(state, $cursor, view)
  )
}

const titleKeymap: { [key: string]: EditorAction } = {
  Backspace: protectSectionTitle,
  Enter: chainCommands(leaveSectionTitle, leaveFigcaption),
  Tab: exitBlock(1),
  'Shift-Tab': exitBlock(-1),
}

export default titleKeymap
