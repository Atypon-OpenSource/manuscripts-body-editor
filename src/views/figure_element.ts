import { EditorProps } from '../components/Editor'
import { INSERT, modelsKey } from '../plugins/models'
import { ManuscriptEditorView, ManuscriptNode } from '../schema/types'
import { buildFigure } from '../transformer/builders'
import { NodeViewCreator } from '../types'
import Block from './block'

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
        const input = document.createElement('input')
        input.accept = 'image/*'
        input.type = 'file'
        input.addEventListener<'change'>('change', this.handleImage(index))

        const image = objects[index]

        const img = image
          ? this.createFigureImage(image.src)
          : this.createFigurePlaceholder()

        img.addEventListener<'click'>('click', () => {
          input.click()
        })

        img.addEventListener<'mouseenter'>('mouseenter', () => {
          img.classList.toggle('over', true)
        })

        img.addEventListener<'mouseleave'>('mouseleave', () => {
          img.classList.toggle('over', false)
        })

        img.addEventListener<'dragover'>('dragover', event => {
          event.preventDefault()
        })

        img.addEventListener<'drop'>('drop', this.handleDrop(index))

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

  private handleImage(index: number) {
    return (event: Event) => {
      const input = event.target as HTMLInputElement

      if (input.files) {
        Array.from(input.files).forEach((file, fileIndex) => {
          this.addImage(file, index + fileIndex)
        })
      }
    }
  }

  private handleDrop(index: number) {
    return (event: DragEvent) => {
      event.preventDefault()

      if (event.dataTransfer && event.dataTransfer.files) {
        Array.from(event.dataTransfer.files).forEach((file, fileIndex) => {
          this.addImage(file, index + fileIndex)
        })
      }
    }
  }

  private createFigureImage(src: string) {
    const element = document.createElement('img')
    element.classList.add('figure')
    element.src = src

    return element
  }

  private createFigurePlaceholder() {
    const element = document.createElement('div')
    element.classList.add('figure')
    element.classList.add('placeholder')

    const instructions = document.createElement('div')
    instructions.textContent = 'Click or drop an image here'
    element.appendChild(instructions)

    return element
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
        .setSelection(this.view.state.selection)
    )
  }
}

const figureElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new FigureElement(props, node, view, getPos)

export default figureElement
