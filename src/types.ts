import { Decoration } from 'prosemirror-view'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeView,
  ManuscriptTransaction,
} from './schema/types'

export type EditorAction = (
  state: ManuscriptEditorState,
  dispatch?: (tr: ManuscriptTransaction) => void,
  view?: ManuscriptEditorView
) => boolean

export type NodeViewCreator = (
  node: ManuscriptNode,
  view: ManuscriptEditorView,
  getPos: () => number,
  decorations: Decoration[]
) => ManuscriptNodeView

export type ChangeReceiver = (
  op: string,
  id: string,
  data?: ManuscriptNode | null
) => void
