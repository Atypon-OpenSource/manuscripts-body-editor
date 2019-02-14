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
import { Model } from '@manuscripts/manuscripts-json-schema'
import {
  Merge,
  mergeTransforms,
  recreateTransform,
} from '@manuscripts/prosemirror-recreate-steps'
import { Transform } from 'prosemirror-transform'
import { Conflict, LocalConflicts } from './conflicts'

export interface ConflictMerge {
  conflict: Conflict
  merge: Merge
  reverseMerge: Merge
  reverseTr: Transform
  tr: Transform
}

export const createMerge = (
  currentNode: ManuscriptNode,
  localNode: ManuscriptNode,
  ancestorNode: ManuscriptNode,
  conflict: Conflict
): ConflictMerge => {
  const wordDiffs = true
  const complexSteps = true

  // change from local parent to current state
  const transform1 = recreateTransform(
    ancestorNode,
    currentNode,
    complexSteps,
    wordDiffs
  )

  // the local change
  const transform2 = recreateTransform(
    ancestorNode,
    localNode,
    complexSteps,
    wordDiffs
  )

  // disabled because it is broken in some edge cases
  const automerge = false
  const rebase = true

  const { merge, tr } = mergeTransforms(
    transform1,
    transform2,
    automerge,
    rebase,
    wordDiffs
  )

  const { merge: reverseMerge, tr: reverseTr } = mergeTransforms(
    transform2,
    transform1,
    automerge,
    rebase,
    wordDiffs
  )

  return { conflict, merge, reverseMerge, reverseTr, tr }
}

export const hydrateConflictNodes = (
  conflict: Conflict,
  decode: (model: Model) => ManuscriptNode | null
) => {
  const { local, ancestor } = conflict
  const localNode = decode(local as Model)
  const ancestorNode = decode(ancestor as Model)

  if (localNode === null || ancestorNode === null) {
    throw new Error('Failed to decode node')
  }

  return { localNode, ancestorNode }
}

export type ConflictNodeIterator = (
  currentNode: ManuscriptNode,
  localNode: ManuscriptNode,
  ancestorNode: ManuscriptNode,
  pos: number,
  conflict: Conflict
) => void

export const iterateConflicts = (
  conflicts: LocalConflicts,
  doc: ManuscriptNode,
  decode: (model: Model) => ManuscriptNode | null,
  fn: ConflictNodeIterator
) => {
  doc.descendants((node: ManuscriptNode, pos: number) => {
    if (!(node.attrs && node.attrs.id && node.attrs.id in conflicts)) {
      return
    }

    for (const conflict of Object.values(conflicts[node.attrs.id])) {
      const { localNode, ancestorNode } = hydrateConflictNodes(conflict, decode)
      fn(node, localNode, ancestorNode, pos + 1, conflict)
    }
  })
}
