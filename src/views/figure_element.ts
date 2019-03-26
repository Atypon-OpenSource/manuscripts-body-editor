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

import { ManuscriptNode } from '@manuscripts/manuscript-transform'
import {
  FigureLayout,
  FigureStyle,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import * as CSS from 'csstype'
import { Decoration } from 'prosemirror-view'
import { EditorProps } from '../components/Editor'
import { NodeViewCreator } from '../types'
import Block from './block'

class FigureElement extends Block {
  protected get elementType() {
    return 'figure'
  }

  // TODO: does this need to be different?
  public update(newNode: ManuscriptNode, decorations?: Decoration[]): boolean {
    if (newNode.type.name !== this.node.type.name) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    this.handleDecorations(decorations)
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
    return (
      event.type !== 'mousedown' &&
      !event.type.startsWith('drop') &&
      !event.type.startsWith('drag')
    )
  }

  public ignoreMutation() {
    return true
  }

  // TODO: load/subscribe to the figure style object from the database and use it here?
  protected createElement() {
    const container = document.createElement('figure-container')
    container.className = 'block'
    this.dom.appendChild(container)

    // figure group
    this.contentDOM = document.createElement(this.elementType)
    this.contentDOM.classList.add('figure-block')
    this.contentDOM.setAttribute('id', this.node.attrs.id)
    this.contentDOM.setAttribute(
      'data-figure-style',
      this.node.attrs.figureStyle
    )

    const style = this.figureStyle

    if (style) {
      if (style.captionPosition === 'above') {
        this.contentDOM.classList.add('caption-above')
      }
    }

    this.applyStyles(this.contentDOM, this.buildElementStyles(style))
    this.applyStyles(this.contentDOM, this.buildPanelStyles(style)) // TODO: move this inside

    container.appendChild(this.contentDOM)
  }

  protected updateContents() {
    const { suppressCaption } = this.node.attrs

    this.dom.classList.toggle('suppress-caption', suppressCaption)

    const layout = this.figureLayout

    const singleFigure = !layout || layout.rows * layout.columns === 1

    this.dom.classList.toggle('single-figure', singleFigure)

    // TODO: apply styles to figures
    // const figureStyles = this.getFigureStyles()
    // this.applyStyles(figureContainer, figureStyles)
  }

  private getDefaultModel<T extends Model>(objectType: ObjectTypes) {
    return this.props.getModel<T>(`${objectType}:default`)
  }

  private get defaultFigureLayout() {
    return this.getDefaultModel<FigureLayout>(ObjectTypes.FigureLayout)
  }

  private get figureLayout() {
    const { figureLayout } = this.node.attrs

    if (figureLayout) {
      const model = this.props.getModel<FigureLayout>(figureLayout)

      if (model) {
        return this.mergePrototypeChain(model)
      }
    }

    return this.defaultFigureLayout
  }

  private get defaultFigureStyle() {
    return this.getDefaultModel<FigureStyle>(ObjectTypes.FigureStyle)
  }

  private get figureStyle() {
    const { figureStyle } = this.node.attrs

    if (figureStyle) {
      const model = this.props.getModel<FigureStyle>(figureStyle)

      if (model) {
        return this.mergePrototypeChain(model)
      }
    }

    return this.defaultFigureStyle
  }

  private mergePrototypeChain<T extends Model>(model: T) {
    let modelWithPrototype = model as T & { prototype: string }

    let output: T = modelWithPrototype

    while (modelWithPrototype.prototype) {
      const parentModel = this.props.getModel<T>(
        modelWithPrototype.prototype
      ) as T & { prototype: string }

      if (!parentModel) {
        break
      }

      // avoid accidental loops
      if (parentModel.prototype === modelWithPrototype.prototype) {
        break
      }

      output = {
        ...parentModel,
        ...output,
      }

      modelWithPrototype = parentModel
    }

    return output
  }

  private buildPanelStyles(style?: FigureStyle): CSS.PropertiesHyphen {
    const output: CSS.PropertiesHyphen = {}

    const layout = this.figureLayout

    if (layout) {
      if (layout.columns) {
        output['grid-template-columns'] = `repeat(${layout.columns}, 1fr)`
      }

      if (layout.rows) {
        output['grid-template-rows'] = `repeat(${
          layout.rows
        }, minmax(min-content, max-content)) [caption] [listing] auto`
      }
    }

    if (style) {
      // output.textAlign = style.alignment
      if (style.innerSpacing) {
        output['column-gap'] = style.innerSpacing + 'px'
        output['row-gap'] = style.innerSpacing + 'px'
      }
    }

    return output
  }

  private buildElementStyles(style?: FigureStyle): CSS.PropertiesHyphen {
    const output: CSS.PropertiesHyphen = {}

    if (style) {
      if (style.outerSpacing) {
        output.padding = style.outerSpacing + 'px'
      }

      if (style.outerBorder) {
        if (style.outerBorder.style) {
          output['border-style'] = style.outerBorder.style // TODO: MPBorder?
        }

        output['border-width'] = style.outerBorder.width + 'px'

        if (style.outerBorder.color) {
          output['border-color'] = style.outerBorder.color // TODO: MPColor?
        }
      }
    }

    // TODO: resolve Colors and Styles

    return output
  }

  // private buildFigureStyles(style?: FigureStyle): CSS.PropertiesHyphen {
  //   const output: CSS.PropertiesHyphen = {
  //     // minWidth: 0,
  //     // minHeight: 0,
  //     'justify-self': 'center',
  //     height: '100%',
  //     // maxWidth: '100%',
  //   }
  //
  //   if (style) {
  //     if (style.innerBorder) {
  //       output['border-style'] = style.innerBorder.style
  //       output['border-width'] = style.innerBorder.width + 'px'
  //
  //       if (style.innerBorder.color) {
  //         output['border-color'] = style.innerBorder.color // TODO: MPColor?
  //       }
  //     }
  //   }
  //
  //   return output
  // }
}

const figureElement = (props: EditorProps): NodeViewCreator => (
  node,
  view,
  getPos
) => new FigureElement(props, node, view, getPos)

export default figureElement
