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
  isElementNode,
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { ResolvedPos } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findParentNodeClosestToPos } from 'prosemirror-utils'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { SyncError, SyncErrors } from '../lib/sync-errors'

export const syncErrorsKey = new PluginKey('sync-errors')

interface SyncErrorsPluginState {
  errors: SyncErrors | null
  decorations: DecorationSet
}

// Object mapping the node where we should display the error, to a list of
// componentIDs which have errors
interface NodeErrors {
  [componentID: string]: {
    syncErrors: SyncError[]
    pos: number
    nodeSize: number
  }
}

const findTopLevelContainingNode = (
  pos: ResolvedPos,
  startNode: ManuscriptNode
) => {
  const predicate = (node: ManuscriptNode) => {
    return isElementNode(node) && node.attrs.id
  }

  if (predicate(startNode)) {
    return {
      id: startNode.attrs.id,
      pos: pos.pos,
      nodeSize: startNode.nodeSize,
    }
  }

  const result = findParentNodeClosestToPos(pos, predicate)

  if (result) {
    return {
      id: result.node.attrs.id,
      pos: result.pos,
      nodeSize: result.node.nodeSize,
    }
  } else {
    // throw new Error('Unable to locate top level containing node')
    return null
  }
}

export default () => {
  return new Plugin<ManuscriptSchema>({
    key: syncErrorsKey,
    state: {
      init: (): SyncErrorsPluginState => {
        return {
          errors: null,
          decorations: DecorationSet.empty,
        }
      },
      apply: (tr, pluginState, oldState, newState): SyncErrorsPluginState => {
        const errorsDoc: SyncErrors = tr.getMeta(syncErrorsKey)

        // New errors
        if (errorsDoc) {
          if (
            pluginState.errors &&
            errorsDoc._rev === pluginState.errors._rev
          ) {
            return pluginState
          }

          const { _id, _rev, ...errors } = errorsDoc

          const nodeErrors: NodeErrors = {}

          newState.doc.descendants((node: ManuscriptNode, pos: number) => {
            if (!(node.attrs && node.attrs.id && node.attrs.id in errors)) {
              return
            }

            const error = errors[node.attrs.id]

            const topLevelNode = findTopLevelContainingNode(
              newState.doc.resolve(pos),
              node
            )

            if (topLevelNode) {
              const { id, pos: topPos, nodeSize: topSize } = topLevelNode

              const existingErrors = nodeErrors[id]

              if (existingErrors) {
                existingErrors.syncErrors.push(error)
              } else {
                nodeErrors[id] = {
                  syncErrors: [error],
                  pos: topPos,
                  nodeSize: topSize,
                }
              }
            }
          })

          const decorations = Object.values(nodeErrors).map(
            ({ pos, nodeSize, syncErrors }) => {
              return Decoration.node(
                pos,
                pos + nodeSize,
                {},
                {
                  syncErrors,
                }
              )
            }
          )

          return {
            decorations: DecorationSet.create(newState.doc, decorations),
            errors: errorsDoc,
          }
        }

        // Document changed, map any existing decorations through transaction
        return {
          decorations: pluginState.decorations.map(tr.mapping, tr.doc),
          errors: pluginState.errors,
        }
      },
    },
    props: {
      decorations(state: ManuscriptEditorState) {
        return syncErrorsKey.getState(state).decorations
      },
    },
  })
}
