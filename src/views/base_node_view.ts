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

import { Model } from '@manuscripts/json-schema'
import { CHANGE_STATUS, TrackedAttrs } from '@manuscripts/track-changes-plugin'
import {
  encode,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/transform'
import { Attrs, Node } from 'prosemirror-model'
import { Decoration, NodeView } from 'prosemirror-view'

import { CSLProps } from '../configs/ManuscriptsEditor'
import { PopperManager } from '../lib/popper'
import { SyncError } from '../types'

export interface BaseNodeProps {
  popper: PopperManager
  getModel: <T extends Model>(id: string) => T | undefined
  getModelMap: () => Map<string, Model>
  cslProps: CSLProps
  renderReactComponent: (
    child: React.ReactElement,
    container: HTMLElement
  ) => void
  unmountReactComponent: (container: HTMLElement) => void
}

export class BaseNodeView<PropsType extends BaseNodeProps> implements NodeView {
  public dom: HTMLElement
  public contentDOM?: HTMLElement
  public syncErrors: SyncError[]
  public elementType = 'div'

  public constructor(
    public readonly props: PropsType,
    public node: ManuscriptNode,
    public readonly view: ManuscriptEditorView,
    public readonly getPos: () => number,
    public decorations: readonly Decoration[]
  ) {}

  public update = (
    newNode: Node,
    decorations: readonly Decoration[]
  ): boolean => {
    // if (!newNode.sameMarkup(this.node)) return false
    if (newNode.attrs.id !== this.node.attrs.id) {
      return false
    }
    if (newNode.type.name !== this.node.type.name) {
      return false
    }
    this.handleDecorations(decorations)
    this.node = newNode
    this.updateContents()
    this.props.popper.update()
    return true
  }

  public initialise = () => {
    // extend this
  }

  public updateContents = () => {
    // extend this
  }

  public setDomAttrs(
    node: ManuscriptNode,
    element: HTMLElement,
    omit: string[] = []
  ) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      if (!omit.includes(attr)) {
        element.setAttribute(attr, node.attrs[attr])
      }
    })
  }

  public selectNode = () => {
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode = () => {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()
  }

  public destroy = () => {
    this.props.popper.destroy()
  }

  public handleDecorations = (decorations: readonly Decoration[]) => {
    this.decorations = decorations

    if (decorations && this.dom) {
      const syncErrorDecoration = decorations.find(
        (decoration) => decoration.spec.syncErrors
      )

      this.syncErrors = syncErrorDecoration
        ? (syncErrorDecoration.spec.syncErrors as SyncError[])
        : []

      this.dom.classList.toggle('has-sync-error', this.syncErrors.length > 0)
    }
  }

  /**
   * This will get model that are inlined with the state of track changes,
   * if it's rejected will return old node attributes.
   */
  public getNodeModel = <T extends Model>(): undefined | T => {
    const nodeId = this.node.attrs.id || this.node.attrs.rid
    let model = this.props.getModel(nodeId)

    if (!model) {
      const change = this.node.attrs.dataTracked?.find(
        ({ id }: TrackedAttrs) =>
          !!this.props.getModel(`${nodeId}:dataTracked:${id}`)
      )

      if (change && change.status === CHANGE_STATUS.rejected) {
        model = encode(
          this.view.state.doc
            .resolve(this.getPos())
            .parent.type.create({}, [this.node.type.create(change.oldAttrs)])
        ).get(nodeId)
      } else {
        model = encode(this.view.state.doc.resolve(this.getPos()).parent).get(
          nodeId
        )
      }

      if (model && change) {
        model = { ...model, _id: `${nodeId}:dataTracked:${change.id}` }
      }
    }

    return model as T
  }

  public updateInlineNode = (attrs: Attrs) => {
    const { tr } = this.view.state
    this.view.dispatch(tr.setNodeMarkup(this.getPos(), undefined, attrs))
  }
}
