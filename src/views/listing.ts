import { NodeView } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { CodeMirrorCreator } from '../lib/codemirror'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import { NodeViewCreator } from '../types'

// TODO: inline code editor

class Listing implements NodeView {
  public dom: HTMLElement
  private editor: CodeMirror.Editor

  private readonly getPos: () => number
  private node: ManuscriptNode
  private readonly view: ManuscriptEditorView

  private readonly imports: {
    codemirror: Promise<CodeMirrorCreator>
  }

  constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
    // decorations?: Decoration[]
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos
    // this.decorations = decorations

    this.imports = {
      codemirror: import(/* webpackChunkName: "codemirror" */ '../lib/codemirror'),
    }

    this.createDOM()
  }

  public update(newNode: ManuscriptNode): boolean {
    if (newNode.attrs.id !== this.node.attrs.id) return false
    if (newNode.type.name !== this.node.type.name) return false
    this.node = newNode
    this.updateContents()
    return true
  }

  public async selectNode() {
    // do nothing
  }

  public stopEvent(event: Event) {
    return event.type !== 'mousedown' && !event.type.startsWith('drag')
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'div'
  }

  protected updateContents() {
    const { contents, isExpanded } = this.node.attrs
    if (isExpanded) {
      this.editor.refresh()
    }
    const editorContents = this.editor.getValue()
    if (editorContents !== contents) {
      this.editor.setValue(contents)
    }
  }

  protected async createDOM() {
    this.dom = document.createElement(this.elementType)
    this.dom.classList.add('listing')
    this.dom.setAttribute('id', this.node.attrs.id)

    const { createEditor } = await this.imports.codemirror

    // TODO: this.node.attrs.languageKey
    this.editor = await createEditor(this.node.attrs.contents, 'python')

    this.editor.on('changes', () => {
      const contents = this.editor.getValue()

      const tr = this.view.state.tr
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          contents,
        })
        .setSelection(this.view.state.selection)

      this.view.dispatch(tr)
    })

    this.dom.appendChild(this.editor.getWrapperElement())

    window.requestAnimationFrame(() => {
      this.editor.refresh()
      this.editor.focus()
    })
  }
}

const listing = (props: EditorProps): NodeViewCreator => (node, view, getPos) =>
  new Listing(props, node, view, getPos)

export default listing
