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

import { EditAttrsTrackingIcon } from '@manuscripts/style-guide'
import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { Fragment, Node as ProsemirrorNode } from 'prosemirror-model'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function isDeleted(node: ProsemirrorNode) {
  if (node.attrs.dataTracked) {
    const changes = node.attrs.dataTracked as TrackedAttrs[]
    return changes.some(({ operation, status }) => operation === 'delete')
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

export const getAttrsTrackingButton = (changeID: string) => {
  const el = document.createElement('button')
  el.className = 'attrs-popper-button'
  el.value = changeID
  el.innerHTML = renderToStaticMarkup(createElement(EditAttrsTrackingIcon))

  return el
}

export function isHidden(node: ProsemirrorNode) {
  return isDeleted(node)
}

export function isDeletedText(node: ProsemirrorNode) {
  if (node.type === schema.nodes.text && node.marks.length) {
    const deleteMark = node.marks.find(
      (mark) => mark.type === schema.marks.tracked_delete
    )
    if (
      deleteMark &&
      deleteMark.attrs?.dataTracked?.status &&
      'pending' === deleteMark.attrs?.dataTracked?.status
    ) {
      return true
    }
  }
  return false
}

export function isRejectedText(node: ProsemirrorNode) {
  if (node.type === schema.nodes.text) {
    const insertMark = node.marks.find(
      (mark) => mark.type === schema.marks.tracked_insert
    )
    if (insertMark && insertMark.attrs?.dataTracked?.status === 'rejected') {
      return true
    }
  }
  return false
}

export function getActualTextContent(fragment: Fragment) {
  let finalContent = ''

  function getContent(fragment: Fragment) {
    fragment.forEach((node) => {
      if (node.type !== schema.nodes.text) {
        finalContent += getContent(node.content)
      }
      if (!isDeletedText(node) && !isRejectedText(node)) {
        finalContent += node.textContent
      }
    })
  }

  getContent(fragment)
  return finalContent
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
