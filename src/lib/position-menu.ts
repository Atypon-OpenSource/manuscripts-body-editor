/*!
 * © 2025 Atypon Systems LLC
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

import { ContextMenu } from '@manuscripts/style-guide'
import {
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { imageDefaultIcon, imageLeftIcon, imageRightIcon } from '../icons'
import ReactSubView from '../views/ReactSubView'
import { handleEnterKey } from './navigation-utils'
import { updateNodeAttrs } from './view'
import BlockView from '../views/block_view'

export enum HorizontalPositions {
  left = 'half-left',
  right = 'half-right',
  default = '',
}

export interface PopperMenuPositionOption {
  label: string
  action: () => void
  icon: string
  selected: boolean
}

export class HorizontalPositionMenu {
  private parent: BlockView<ManuscriptNode>

  menuOpen: boolean = false
  posMenuSelector = 'position-menu'
  onChange: (newPos: HorizontalPositions) => void
  positionMenuWrapper: HTMLDivElement
  location: HTMLElement
  getPositionSource?: () => ManuscriptNode | null

  constructor(
    parent: BlockView<ManuscriptNode>,
    onChange: (newPos: HorizontalPositions) => void,
    location?: HTMLElement,
    getPositionSource?: () => ManuscriptNode | null // if different from parent as in figure element case
  ) {
    const preSource = getPositionSource?.() || parent.node
    if (typeof preSource.attrs.type === 'undefined') {
      console.error("This node doesn't support horizontal alignment")
      return
    }
    this.getPositionSource = getPositionSource
    this.location = location || parent.dom
    this.onChange = onChange.bind(parent)
    this.parent = parent
  }

  static createPositionOptions<T extends ManuscriptNode>(
    nodeType: ManuscriptNodeType,
    node: T,
    currentPosition: string,
    view: ManuscriptEditorView,
    onComplete?: () => void
  ) {
    const createAction = (position: string) => () => {
      onComplete?.()
      console.log(node)
      console.log(nodeType)
      console.log({
        ...node.attrs,
        type: position,
      })
      updateNodeAttrs(view, nodeType, {
        ...node.attrs,
        type: position,
      })
    }

    return [
      {
        title: 'Left',
        action: createAction(HorizontalPositions.left),
        IconComponent: imageLeftIcon,
        iconName: 'ImageLeft',
        selected: currentPosition === HorizontalPositions.left,
      },
      {
        title: 'Center',
        action: createAction(HorizontalPositions.default),
        IconComponent: imageDefaultIcon,
        iconName: 'ImageDefault',
        selected: !currentPosition,
      },
      {
        title: 'Right',
        action: createAction(HorizontalPositions.right),
        IconComponent: imageRightIcon,
        iconName: 'ImageRight',
        selected: currentPosition === HorizontalPositions.right,
      },
    ]
  }

  createPopperMenuPositionOptions<T extends ManuscriptNode>(
    nodeType: ManuscriptNodeType,
    node: T,
    currentPosition: string,
    view: ManuscriptEditorView,
    onComplete?: () => void
  ): PopperMenuPositionOption[] {
    return HorizontalPositionMenu.createPositionOptions(
      nodeType,
      node,
      currentPosition,
      view,
      onComplete
    ).map((option) => ({
      label: option.title,
      action: option.action,
      icon: option.iconName,
      selected: option.selected,
    }))
  }

  createPositionMenuWrapper(currentPosition: string, props: EditorProps) {
    const can = props.getCapabilities()
    const positionMenuWrapper = document.createElement('div')
    positionMenuWrapper.classList.add(this.posMenuSelector)

    const positionMenuButton = document.createElement('div')
    positionMenuButton.classList.add('position-menu-button')

    let icon
    switch (currentPosition) {
      case HorizontalPositions.left:
        icon = imageLeftIcon
        break
      case HorizontalPositions.right:
        icon = imageRightIcon
        break
      default:
        icon = imageDefaultIcon
        break
    }
    if (icon) {
      positionMenuButton.innerHTML = icon
    }
    const onClick = this.showPositionMenu.bind(this)
    if (can.editArticle) {
      positionMenuButton.tabIndex = 0
      positionMenuButton.addEventListener('click', onClick)
      positionMenuButton.addEventListener('keydown', handleEnterKey(onClick))
    }
    positionMenuWrapper.appendChild(positionMenuButton)
    return positionMenuWrapper
  }

  getHorizontalPositionOptions(
    current: string,
    onPick: (newPos: HorizontalPositions) => void,
    destroy: () => void
  ) {
    const componentProps = {
      actions: [
        {
          label: 'Left',
          action: () => {
            destroy()
            console.log(this)
            this.menuOpen = false
            onPick(HorizontalPositions.left)
          },
          icon: 'ImageLeft',
          selected: current === HorizontalPositions.left,
        },
        {
          label: 'Default',
          action: () => {
            destroy()
            this.menuOpen = false
            onPick(HorizontalPositions.default)
          },
          icon: 'ImageDefault',
          selected: !current,
        },
        {
          label: 'Right',
          action: () => {
            destroy()
            this.menuOpen = false
            onPick(HorizontalPositions.right)
          },
          icon: 'ImageRight',
          selected: current === HorizontalPositions.right,
        },
      ],
    }

    return componentProps
  }

  showPositionMenu() {
    const p = this.parent
    p.props.popper.destroy.call(p.props.popper)
    // if (this.menuOpen) {
    //   this.menuOpen = false
    //   return
    // }

    const posSource = this.getPositionSource
      ? this.getPositionSource()
      : this.parent.node

    const componentProps = this.getHorizontalPositionOptions(
      posSource?.attrs.type || HorizontalPositions.default,
      this.onChange,
      p.props.popper.destroy.bind(p.props.popper)
    )
    this.menuOpen = true
    p.props.popper.show(
      this.positionMenuWrapper,
      ReactSubView(
        p.props,
        ContextMenu,
        componentProps,
        p.node,
        p.getPos,
        p.view,
        ['context-menu', this.posMenuSelector]
      ),
      'left',
      false
    )
  }

  create() {
    if (!this.parent) {
      return
    }
    const p = this.parent
    if (p.props.getCapabilities()?.editArticle) {
      // Remove existing position menu if it exists
      let existingMenu = this.location.querySelector('.' + this.posMenuSelector)
      if (existingMenu) {
        // disable popper
        existingMenu.remove()

        existingMenu = null
      }

      const posSource = this.getPositionSource
        ? this.getPositionSource()
        : this.parent.node

      this.positionMenuWrapper = this.createPositionMenuWrapper(
        posSource?.attrs.type || HorizontalPositions.default,
        p.props
      )
      this.location.prepend(this.positionMenuWrapper)

      if (this.menuOpen) {
        this.showPositionMenu()
      }
    }
  }
}
