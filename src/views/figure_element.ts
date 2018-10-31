import { EditorProps } from '../components/Editor'
import { INSERT, modelsKey } from '../plugins/models'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import { buildFigure } from '../transformer/builders'
import { NodeViewCreator } from '../types'
import Block from './block'

// ToolbarIconFigure
const placeholder = `<svg width="19" height="16">
  <path d="M6.5.5h6A3.5 3.5 0 0 1 16 4v8a3.5 3.5 0 0 1-3.5 3.5h-6A3.5 3.5 0 0 1 3 12V4A3.5 3.5 0 0 1 6.5.5zm0 1.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-6zm.75 3a.75.75 0 0 1 .75.75v5.5a.75.75 0 1 1-1.5 0v-5.5A.75.75 0 0 1 7.25 5zm3 2a.75.75 0 0 1 .75.75v3.5a.75.75 0 1 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75z" fill="#80BE86" fill-rule="evenodd"/>
</svg>`

// TODO: double-click to select in caption

class FigureElement extends Block {
  private container: HTMLElement
  private element: HTMLElement

  public constructor(
    props: EditorProps,
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    super(props, node, view, getPos)

    this.initialise()
  }

  // TODO: does this need to be different?
  public update(newNode: ManuscriptNode) {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.node = newNode
    this.updateContents()
    return true
  }

  public selectNode() {
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode')
  }

  public stopEvent(event: Event) {
    return event.type !== 'mousedown'
  }

  public ignoreMutation() {
    return true
  }

  protected get elementType() {
    return 'figure'
  }

  // TODO: load/subscribe to the figure style object from the database and use it here?
  protected createElement() {
    this.element = document.createElement(this.elementType)
    this.element.className = 'block'
    this.element.setAttribute('id', this.node.attrs.id)
    this.element.setAttribute('data-figure-style', this.node.attrs.figureStyle)

    this.container = document.createElement('div')
    this.container.className = 'figure-panel'
    this.container.contentEditable = 'false'
    this.element.appendChild(this.container)

    this.contentDOM = document.createElement('div') // TODO: figcaption?
    this.element.appendChild(this.contentDOM)

    this.dom.appendChild(this.element)
  }

  protected updateContents() {
    const {
      rows,
      columns,
      containedObjectIDs,
      suppressCaption,
    } = this.node.attrs

    const objects = containedObjectIDs.map(this.props.getModel)

    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.firstChild as Node)
    }

    let index = 0

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const img = document.createElement('img')
        img.className = 'figure'

        const image = objects[index]

        if (image) {
          img.src = image.src
        } else {
          img.innerHTML = placeholder
          img.classList.add('placeholder')
        }

        const input = document.createElement('input')
        input.accept = 'image/*'
        input.type = 'file'

        input.addEventListener('change', this.handleImage(index))

        img.addEventListener('click', () => {
          input.click()
        })

        // TODO: should "figure" be a node?
        const figureContainer = document.createElement('div')
        figureContainer.appendChild(img)

        if (image && image.title) {
          // TODO: depends on figure layout
          const title = document.createElement('div')
          title.textContent = image.title // TODO: can this be HTML?
          figureContainer.appendChild(title) // TODO: add label
        }

        // TODO: a popup editor for figure contents and metadata?

        this.container.appendChild(figureContainer)

        index++
      }
    }

    this.dom.classList.toggle('suppress-caption', suppressCaption)
  }

  private handleImage(index: number): EventListener {
    return event => {
      const input = event.target as HTMLInputElement

      if (!input.files) return

      Array.from(input.files).forEach((file, fileIndex) => {
        this.addImage(file, index + fileIndex)
      })
    }
  }

  private addImage(file: File, index: number) {
    const figure = buildFigure(file)

    // IMPORTANT: the array must be cloned here, not modified
    const containedObjectIDs = [...this.node.attrs.containedObjectIDs]
    containedObjectIDs[index] = figure._id

    this.view.dispatch(
      this.view.state.tr
        .setMeta(modelsKey, { [INSERT]: [figure] })
        .setNodeMarkup(this.getPos(), undefined, {
          ...this.node.attrs,
          containedObjectIDs,
        })
    )
  }
}

const figureElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new FigureElement(props, node, view, getPos)

export default figureElement
