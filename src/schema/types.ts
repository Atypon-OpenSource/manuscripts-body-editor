import {
  Fragment,
  Node as ProsemirrorNode,
  NodeType,
  Schema,
  Slice,
} from 'prosemirror-model'
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView, NodeView } from 'prosemirror-view'

export type Marks =
  | 'bold'
  | 'code'
  | 'italic'
  | 'link'
  | 'smallcaps'
  | 'strikethrough'
  | 'subscript'
  | 'superscript'
  | 'underline'

export type Nodes =
  | 'bibliography_element'
  | 'bibliography_section'
  | 'bullet_list'
  | 'caption'
  | 'citation'
  | 'cross_reference'
  | 'doc'
  | 'equation'
  | 'equation_element'
  | 'figcaption'
  | 'figure_element'
  | 'footnote'
  | 'footnotes_element'
  | 'hard_break'
  | 'inline_equation'
  | 'inline_footnote'
  | 'list_item'
  | 'listing'
  | 'listing_element'
  | 'manuscript'
  | 'ordered_list'
  | 'paragraph'
  | 'placeholder'
  | 'placeholder_element'
  | 'section'
  | 'section_title'
  | 'table'
  | 'table_cell'
  | 'table_element'
  | 'tbody_row'
  | 'text'
  | 'tfoot_row'
  | 'thead_row'
  | 'toc_element'
  | 'toc_section'
  | 'uniprot'

export type ManuscriptSchema = Schema<Nodes, Marks>

export type ManuscriptEditorState = EditorState<ManuscriptSchema>
export type ManuscriptEditorView = EditorView<ManuscriptSchema>
export type ManuscriptFragment = Fragment<ManuscriptSchema>
export type ManuscriptNode = ProsemirrorNode<ManuscriptSchema>
export type ManuscriptNodeSelection = NodeSelection<ManuscriptSchema>
export type ManuscriptTextSelection = TextSelection<ManuscriptSchema>
export type ManuscriptNodeType = NodeType<ManuscriptSchema>
export type ManuscriptNodeView = NodeView<ManuscriptSchema>
export type ManuscriptSlice = Slice<ManuscriptSchema>
export type ManuscriptTransaction = Transaction<ManuscriptSchema>
