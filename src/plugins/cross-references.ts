/*!
 * © 2024 Atypon Systems LLC
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
} from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { XrefGroup } from '../components/cross-ref-check-modal/CrossRefWarningModal'
import { openCrossRefWarningModal } from '../components/cross-ref-check-modal/openModal'
import { objectsKey } from './objects'

let modalActive = false
let modalElement: HTMLDivElement | null = null

export default () => {
  let view: ManuscriptEditorView | null = null

  return new Plugin({
    view(editorView) {
      view = editorView as ManuscriptEditorView
      return {
        update(v) {
          view = v as ManuscriptEditorView
        },
        destroy() {
          view = null
        },
      }
    },

    filterTransaction(tr, state) {
      // Allow non-doc-changing transactions (selections, focus, etc.)
      if (!tr.docChanged) {
        return true
      }

      // IMPORTANT: Always allow collab transactions — blocking these would
      // cause the editor to desync with the authority and break collaboration.
      // Also allow transactions from other plugins (appendTransaction, etc.)
      // which also set addToHistory to false.
      if (tr.getMeta('addToHistory') === false) {
        return true
      }

      // Block all transactions while modal is active
      if (modalActive) {
        return false
      }

      // Build a map of xref references from the RESULTING doc (tr.doc).
      // Using tr.doc ensures that if the transaction also deletes the xrefs
      // that reference the node, they won't appear in the map and the
      // transaction will be allowed through (producing a valid doc).
      const xrefsByRid = new Map<
        string,
        { node: ManuscriptNode; pos: number }[]
      >()
      tr.doc.descendants((node, pos) => {
        if (node.type === schema.nodes.cross_reference) {
          const rids = node.attrs.rids as string[]
          for (const rid of rids) {
            let entries = xrefsByRid.get(rid)
            if (!entries) {
              entries = []
              xrefsByRid.set(rid, entries)
            }
            entries.push({ node: node as ManuscriptNode, pos })
          }
        }
      })

      // No xrefs in the resulting doc — nothing to warn about
      if (xrefsByRid.size === 0) {
        return true
      }

      // Collect ids of all nodes in the old doc
      const oldIds = new Set<string>()
      state.doc.descendants((node) => {
        const id = node.attrs.id
        if (id) {
          oldIds.add(id)
        }
      })

      // Collect ids of all nodes in the new doc
      const newIds = new Set<string>()
      tr.doc.descendants((node) => {
        const id = node.attrs.id
        if (id) {
          newIds.add(id)
        }
      })

      // Find fully deleted nodes whose ids are still referenced by xrefs
      // in the resulting doc. Partial deletions preserve the node (and its
      // id attribute), so they won't trigger a warning.
      const xrefGroups: XrefGroup[] = []
      for (const id of oldIds) {
        if (!newIds.has(id) && xrefsByRid.has(id)) {
          // Find the original node for the modal display
          let referencedNode: ManuscriptNode | null = null
          state.doc.descendants((node) => {
            if (node.attrs.id === id) {
              referencedNode = node as ManuscriptNode
            }
          })
          if (referencedNode) {
            xrefGroups.push({
              referenced: referencedNode,
              xrefs: xrefsByRid.get(id)!.map(({ node, pos }) => [node, pos]),
            })
          }
        }
      }

      // No referenced nodes were deleted — allow the transaction
      if (xrefGroups.length === 0) {
        return true
      }

      // Block the transaction and show a warning modal
      modalActive = true

      const cleanup = () => {
        modalActive = false
        if (modalElement) {
          modalElement.remove()
          modalElement = null
        }
      }

      const onConfirm = () => {
        cleanup()
        if (!view) {
          return
        }
        // Replay the intercepted transaction's steps on the current state
        const newTr = view.state.tr
        for (const step of tr.steps) {
          const result = step.apply(newTr.doc)
          if (result.failed) {
            // Steps are no longer applicable (e.g. doc changed via collab)
            console.warn(
              'Cross-ref warning: could not replay step —',
              result.failed
            )
            return
          }
          newTr.step(step)
        }
        view.dispatch(newTr)
      }

      const onClose = () => {
        cleanup()
      }

      if (view) {
        modalElement = openCrossRefWarningModal(
          view,
          xrefGroups,
          onConfirm,
          onClose
        )
      }

      return false
    },

    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        let decoSet = oldDecorationSet
        const oldTargets = objectsKey.getState(oldState)
        const newTargets = objectsKey.getState(newState)
        if (tr.docChanged && !isEqual(oldTargets, newTargets)) {
          const decorations = createDecorations(tr.doc)
          decoSet = DecorationSet.create(tr.doc, decorations)
        }

        return decoSet
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)
      },
    },
  })
}

/**
 * Helper function to create decorations for specific node types.
 * @param {Node} doc - The document to scan.
 * @returns {Decoration[]} - An array of decorations.
 */
function createDecorations(doc: Node): Decoration[] {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type === schema.nodes.cross_reference) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: `decorated-${Date.now()}`,
        })
      )
    }
  })
  return decorations
}
