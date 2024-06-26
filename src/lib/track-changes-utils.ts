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

import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { ManuscriptNode } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'

import { editAttrsTrackingIcon } from '../assets'
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

export function getChangeClasses(dataTracked?: TrackedAttrs[]) {
  const classes: string[] = []

  if (dataTracked) {
    const changes = dataTracked as TrackedAttrs[]
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
  el.innerHTML = editAttrsTrackingIcon

  return el
}

export function isHidden(node: ProsemirrorNode) {
  return isDeleted(node) || isRejectedInsert(node)
}

export function sanitizeAttrsChange<T extends ProsemirrorNode>(
  newAttr: T['attrs'],
  currentAttrs: T['attrs']
) {
  return Object.keys(newAttr).reduce((acc, attr) => {
    const key = attr as keyof T['attrs']
    if (!currentAttrs[key] && currentAttrs[key] !== 0 && !newAttr[key]) {
      return acc
    }
    acc[key] = newAttr[key]
    return acc
  }, {} as T['attrs'])
}
