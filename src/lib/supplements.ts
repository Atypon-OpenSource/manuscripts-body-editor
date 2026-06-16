/*!
 * © 2026 Atypon Systems LLC
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
  schema,
  SupplementNode,
} from '@manuscripts/transform'
import { findParentNodeClosestToPos } from 'prosemirror-utils'

import { allowedHref } from './url'

export type NodeWeblink = {
  node: SupplementNode
  pos: number
}

export const getSupplementDisplayLabel = (
  node: SupplementNode,
  files: { id: string; name: string }[]
): string => {
  const href = node.attrs.href
  if (allowedHref(href)) {
    return href
  }

  const file = files.find((f) => f.id === href)
  return file?.name ?? 'Untitled supplement'
}

export const performDeleteSupplement = (
  view: ManuscriptEditorView,
  pos: number
): boolean => {
  const node = view.state.doc.nodeAt(pos)
  if (!node || node.type !== schema.nodes.supplement) {
    return false
  }

  const from = pos
  const to = from + node.nodeSize
  const { from: deleteFrom, to: deleteTo } = deleteSupplementAtPos(
    view.state.doc,
    from,
    to
  )
  view.dispatch(view.state.tr.delete(deleteFrom, deleteTo))
  return true
}

export const deleteSupplementAtPos = (
  doc: ManuscriptNode,
  from: number,
  to: number
) => {
  const resolvedPos = doc.resolve(from)
  const supplementsNodeWithPos = findParentNodeClosestToPos(
    resolvedPos,
    (node) => node.type === schema.nodes.supplements
  )

  if (!supplementsNodeWithPos) {
    return { from, to, deleteWholeSection: false }
  }

  const { node: supplementsNode, pos: supplementsPos } = supplementsNodeWithPos
  const lastSupplement = supplementsNode.childCount === 2

  if (lastSupplement) {
    return {
      from: supplementsPos,
      to: supplementsPos + supplementsNode.nodeSize,
      deleteWholeSection: true,
    }
  }

  return { from, to, deleteWholeSection: false }
}
