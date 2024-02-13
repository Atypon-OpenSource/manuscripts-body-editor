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
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptNode } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { DecorationAttrs } from 'prosemirror-view'

import { TrackableAttributes } from '../types'

export function isRejectedInsert(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation, status }) => operation === 'insert' && status == 'rejected'
    )
  }
  return false
}

export function isDeleted(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation, status }) => operation === 'delete' && status !== 'rejected'
    )
  }
  return false
}

export function isPendingInsert(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation, status }) => operation === 'insert' && status == 'pending'
    )
  }
  return false
}

export function isPending(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(({ status }) => status == 'pending')
  }
  return false
}

export function isPendingSetAttrs(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation, status }) =>
        operation === 'set_attrs' && status == 'pending'
    )
  }
  return false
}

export function getChangeClasses(node: ProsemirrorNode) {
  const classes: string[] = []

  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    const operationClasses = new Map([
      ['insert', 'inserted'],
      ['delete', 'deleted'],
      ['set_attrs', 'set_attrs'],
    ])
    changes.forEach(({ operation, status }) =>
      classes.push(operationClasses.get(operation) || '', status)
    )
  }
  return classes
}

export function isTracked(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(
      ({ operation }) =>
        operation === 'insert' ||
        operation === 'delete' ||
        operation === 'set_attrs'
    )
  }
  return false
}

export function getActualAttrs<T extends ManuscriptNode>(node: T) {
  const attrs = node.attrs as TrackableAttributes<T>
  if (
    attrs.dataTracked &&
    attrs.dataTracked[0].status === 'rejected' &&
    attrs.dataTracked[0].operation === 'set_attrs'
  ) {
    return attrs.dataTracked[0].oldAttrs as T['attrs']
  }
  return attrs
}

export const getAttrsTrackingButton = (changeID: string) => {
  const el = document.createElement('button')
  el.className = 'attrs-popper-button'
  el.value = changeID
  el.innerHTML = editIcon

  return el
}

const editIcon = `
 <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14 4L9 9L6 10L7 7L12 2Z"
      stroke="#353535"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13 10V11.5C13 12.328 12.328 13 11.5 13H4.5C3.672 13 3 12.328 3 11.5V4.5C3 3.672 3.672 3 4.5 3H6"
      stroke="#353535"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`

export const getMarkDecoration = (
  dataTracked: TrackedAttrs,
  htmlNode?: HTMLElement
) => {
  const style: {
    background?: string
    textDecoration?: string
    display?: string
  } = htmlNode?.style || {}
  let className = undefined

  const { status, operation } = dataTracked

  if (
    (operation === CHANGE_OPERATION.delete ||
      operation === CHANGE_OPERATION.insert ||
      operation === CHANGE_OPERATION.set_node_attributes) &&
    status === CHANGE_STATUS.pending
  ) {
    style.background = '#ddf3fa'
  }

  if (
    (operation === CHANGE_OPERATION.insert ||
      operation === CHANGE_OPERATION.set_node_attributes) &&
    status === CHANGE_STATUS.accepted
  ) {
    style.background = '#bffca7'
  }

  if (
    operation === CHANGE_OPERATION.delete &&
    status === CHANGE_STATUS.pending
  ) {
    style.textDecoration = 'line-through'
  }

  if (
    (operation === CHANGE_OPERATION.insert &&
      status === CHANGE_STATUS.rejected) ||
    (operation === CHANGE_OPERATION.delete && status === CHANGE_STATUS.accepted)
  ) {
    style.display = 'none'
  }

  const showAttrsPopper =
    status === CHANGE_STATUS.pending &&
    operation === CHANGE_OPERATION.set_node_attributes

  if (showAttrsPopper) {
    className = 'attrs-track-mark'
    if (htmlNode) {
      htmlNode.className = 'attrs-track-mark'
    }
  }

  return {
    class: className,
    style: `background: ${style.background};
   text-decoration: ${style.textDecoration};
   display: ${style.display};
   position: relative;`,
  } as DecorationAttrs
}
