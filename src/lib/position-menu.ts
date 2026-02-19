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

import { ContextMenu, ContextMenuProps } from '@manuscripts/style-guide'
import {
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { imageDefaultIcon, imageLeftIcon, imageRightIcon } from '../icons'
import { figurePositions } from '../views/image_element'
import ReactSubView from '../views/ReactSubView'
import { handleEnterKey } from './navigation-utils'
import { updateNodeAttrs } from './view'

export interface PopperMenuPositionOption {
  label: string
  action: () => void
  icon: string
  selected: boolean
}

export const createPositionOptions = <T extends ManuscriptNode>(
  nodeType: ManuscriptNodeType,
  node: T,
  currentPosition: string,
  view: ManuscriptEditorView,
  onComplete?: () => void
) => {
  const createAction = (position: string) => () => {
    onComplete?.()
    updateNodeAttrs(view, nodeType, {
      ...node.attrs,
      type: position,
    })
  }

  return [
    {
      title: 'Left',
      action: createAction(figurePositions.left),
      IconComponent: imageLeftIcon,
      iconName: 'ImageLeft',
      selected: currentPosition === figurePositions.left,
    },
    {
      title: 'Center',
      action: createAction(figurePositions.default),
      IconComponent: imageDefaultIcon,
      iconName: 'ImageDefault',
      selected: !currentPosition,
    },
    {
      title: 'Right',
      action: createAction(figurePositions.right),
      IconComponent: imageRightIcon,
      iconName: 'ImageRight',
      selected: currentPosition === figurePositions.right,
    },
  ]
}

export const createPopperMenuPositionOptions = <T extends ManuscriptNode>(
  nodeType: ManuscriptNodeType,
  node: T,
  currentPosition: string,
  view: ManuscriptEditorView,
  onComplete?: () => void
): PopperMenuPositionOption[] => {
  return createPositionOptions(
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

export const showPositionMenu = <T extends ManuscriptNode>(
  nodeType: ManuscriptNodeType,
  node: T,
  currentPosition: string,
  positionMenuWrapper: HTMLElement,
  view: ManuscriptEditorView,
  getPos: () => number,
  props: EditorProps
) => {
  props.popper.destroy()

  const options = createPopperMenuPositionOptions(
    nodeType,
    node,
    currentPosition,
    view,
    () => props.popper.destroy()
  )

  const componentProps: ContextMenuProps = {
    actions: options,
  }

  props.popper.show(
    positionMenuWrapper,
    ReactSubView(props, ContextMenu, componentProps, node, getPos, view, [
      'context-menu',
      'position-menu',
    ]),
    'left',
    false
  )
}

export const setElementPositionAlignment = (
  element: HTMLElement,
  position: string
): void => {
  switch (position) {
    case figurePositions.left:
      element.setAttribute('data-alignment', 'left')
      break
    case figurePositions.right:
      element.setAttribute('data-alignment', 'right')
      break
    default:
      element.removeAttribute('data-alignment')
      break
  }
}

export const createPositionMenuWrapper = (
  currentPosition: string,
  onClick: () => void,
  props: EditorProps
): HTMLDivElement => {
  const can = props.getCapabilities()
  const positionMenuWrapper = document.createElement('div')
  positionMenuWrapper.classList.add('position-menu')

  const positionMenuButton = document.createElement('div')
  positionMenuButton.classList.add('position-menu-button')

  let icon
  switch (currentPosition) {
    case figurePositions.left:
      icon = imageLeftIcon
      break
    case figurePositions.right:
      icon = imageRightIcon
      break
    default:
      icon = imageDefaultIcon
      break
  }
  if (icon) {
    positionMenuButton.innerHTML = icon
  }
  if (can.editArticle) {
    positionMenuButton.tabIndex = 0
    positionMenuButton.addEventListener('click', onClick)
    positionMenuButton.addEventListener('keydown', handleEnterKey(onClick))
  }
  positionMenuWrapper.appendChild(positionMenuButton)
  return positionMenuWrapper
}
