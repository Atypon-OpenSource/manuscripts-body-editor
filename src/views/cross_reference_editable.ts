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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import { isDeleted, skipTracking } from '@manuscripts/track-changes-plugin'
import { schema, Target } from '@manuscripts/transform'
import { TextSelection } from 'prosemirror-state'

import { CrossReferenceItems } from '../components/views/CrossReferenceItems'
import { handleComment } from '../lib/comments'
import { objectsKey } from '../plugins/objects'
import { createEditableNodeView } from './creators'
import {
  CrossReferenceView,
  isValidCrossReferenceTarget,
} from './cross_reference'
import ReactSubView from './ReactSubView'

export class CrossReferenceEditableView extends CrossReferenceView {
  protected popperContainer: HTMLDivElement
  protected contextMenu: HTMLElement

  public selectNode = () => {
    const { getCapabilities } = this.props

    const rids = this.node.attrs.rids
    const can = getCapabilities()

    if (!can?.editArticle || rids.length) {
      return
    }

    this.showPicker()
  }

  public showPicker = () => {
    const rids = this.node.attrs.rids

    const componentProps = {
      handleSelect: this.handleSelect,
      targets: this.getTargets(),
      handleCancel: this.handleCancel,
      currentTargetId: rids[0],
      currentCustomLabel: this.node.attrs.label,
      isEdit: rids.length > 0,
    }

    this.popperContainer = ReactSubView(
      this.props,
      CrossReferenceItems,
      componentProps,
      this.node,
      this.getPos,
      this.view
    )
    this.popperContainer.setAttribute('tabindex', '0')
    this.props.popper.show(this.dom, this.popperContainer, 'auto')
  }

  public destroy = () => {
    this.props.popper.destroy()
    this.popperContainer?.remove()
  }

  public deselectNode = () => {
    this.handleCancel()
  }

  public getTargets = () => {
    const targets = objectsKey.getState(this.view.state) as Map<string, Target>
    const fileMap = new Map(this.props.getFiles().map((f) => [f.id, f.name]))
    const imageElement = schema.nodes.image_element.name
    const supplement = schema.nodes.supplement.name

    return Array.from(targets.values()).reduce<Target[]>((acc, t) => {
      // Plain Simple Images are not cross-referenceable; only those with a
      // linked file (extLink → Target.href) should appear in the picker.
      if (t.type === imageElement && !t.href) {
        return acc
      }
      // File-backed targets (supplements and linked files) use the uploaded
      // file name as the label; caption is not applicable.
      if ((t.type === supplement || t.type === imageElement) && t.href) {
        acc.push({ ...t, label: fileMap.get(t.href) ?? '', caption: '' })
      } else {
        acc.push(t)
      }
      return acc
    }, [])
  }

  public handleCancel = () => {
    if (!this.node.attrs.rids.length) {
      const { state } = this.view

      const pos = this.getPos()
      if (pos === undefined) {
        return
      }
      const label = this.node.attrs.label
      const tr = label
        ? state.tr.replaceWith(
            pos,
            pos + this.node.nodeSize,
            state.schema.text(label)
          )
        : state.tr.delete(pos, pos + this.node.nodeSize)
      tr.setSelection(TextSelection.create(tr.doc, pos))
      skipTracking(tr)
      this.view.dispatch(tr)
    } else {
      this.destroy()
    }
  }

  public handleSelect = async (rid: string, label?: string) => {
    const { state } = this.view

    const pos = this.getPos()

    const tr = state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      label,
      rids: [rid],
    })

    const selection = TextSelection.create(tr.doc, pos)

    this.view.dispatch(tr.setSelection(selection))

    this.destroy()
  }

  public handleClick = () => {
    if (isDeleted(this.node)) {
      return
    }
    if (!this.node.attrs.rids.length) {
      return
    }
    this.showContextMenu()
  }

  public showContextMenu = () => {
    this.props.popper.destroy()

    const can = this.props.getCapabilities()

    const targets = objectsKey.getState(this.view.state) as Map<string, Target>
    const rid = this.node.attrs.rids[0]
    const isOrphaned = !isValidCrossReferenceTarget(targets?.get(rid))

    const actions: ContextMenuProps['actions'] = [
      {
        label: 'Comment',
        icon: 'AddComment',
        action: () => {
          this.props.popper.destroy()
          handleComment(this.node, this.view)
        },
      },
      {
        label: 'Go to content',
        icon: 'Scroll',
        action: () => this.navigateToTarget(),
        disabled: isOrphaned,
      },
    ]

    if (can?.editArticle) {
      actions.unshift({
        label: 'Edit',
        icon: 'Edit',
        action: () => this.handleEdit(),
        disabled: isOrphaned,
      })
    }

    this.contextMenu = ReactSubView(
      this.props,
      ContextMenu,
      { actions },
      this.node,
      this.getPos,
      this.view,
      ['context-menu']
    )

    this.props.popper.show(this.dom, this.contextMenu, 'right-start', false)
  }

  private navigateToTarget = () => {
    this.props.popper.destroy()
    const rids = this.node.attrs.rids
    if (!rids.length) {
      return
    }
    this.props.navigate({
      pathname: this.props.location.pathname,
      hash: '#' + rids[0],
    })
  }

  private handleEdit = () => {
    this.props.popper.destroy()
    this.showPicker()
  }
}

export default createEditableNodeView(CrossReferenceEditableView)
