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

import {
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { Decoration } from 'prosemirror-view'
import { ViewerProps } from '../components/Viewer'
import { SyncError } from '../types'

export class BaseNodeView<PropsType extends ViewerProps> {
  public dom: HTMLElement
  public contentDOM: HTMLElement
  public syncErrors: SyncError[]
  public elementType = 'div'

  public constructor(
    public readonly props: PropsType,
    public node: ManuscriptNode,
    public readonly view: ManuscriptEditorView,
    public readonly getPos: () => number
  ) {}

  public update = (
    newNode: ManuscriptNode,
    decorations: Decoration[]
  ): boolean => {
    // if (!newNode.sameMarkup(this.node)) return false
    if (newNode.attrs.id !== this.node.attrs.id) return false
    if (newNode.type.name !== this.node.type.name) return false
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

  public selectNode = () => {
    this.dom.classList.add('ProseMirror-selectednode')
  }

  public deselectNode = () => {
    this.dom.classList.remove('ProseMirror-selectednode')
    this.props.popper.destroy()
  }

  public handleDecorations = (decorations?: Decoration[]) => {
    if (decorations) {
      const syncErrorDecoration = decorations.find(
        decoration => decoration.spec.syncErrors
      )
      this.syncErrors = syncErrorDecoration
        ? syncErrorDecoration.spec.syncErrors
        : []
      this.dom.classList.toggle('has-sync-error', this.syncErrors.length > 0)
    }
  }
}
