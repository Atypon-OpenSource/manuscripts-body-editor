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
import { trackChangesPluginKey } from '@manuscripts/track-changes-plugin'
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

      // plugins working with content silently are not the subject to a warning. Especially the Collab plugin!
      if (tr.getMeta('addToHistory') === false) {
        return true
      }

      // Track changes plugin can modify content without setting addToHistory=false
      if (tr.getMeta(trackChangesPluginKey)) {
        return true
      }

      // Block all transactions while modal is active
      if (modalActive) {
        return false
      }

      // Single pass on tr.doc: collect all node ids and all xref rids.
      // Using tr.doc ensures that if the transaction also deletes the xrefs
      // that reference the node, they won't appear in the map and the
      // transaction will be allowed through (producing a valid doc).
      const newIds = new Set<string>()
      const xrefsByRid = new Map<
        string,
        { node: ManuscriptNode; pos: number }[]
      >()
      tr.doc.descendants((node, pos) => {
        if (node.attrs.id) {
          newIds.add(node.attrs.id)
        }
        if (node.type === schema.nodes.cross_reference) {
          for (const rid of node.attrs.rids as string[]) {
            let entries = xrefsByRid.get(rid)
            if (!entries) {
              entries = []
              xrefsByRid.set(rid, entries)
            }
            entries.push({ node: node as ManuscriptNode, pos })
          }
        }
      })

      // Find xrefs that point to ids no longer present in the resulting doc
      const orphanedRids = new Set<string>()
      for (const rid of xrefsByRid.keys()) {
        if (!newIds.has(rid)) {
          orphanedRids.add(rid)
        }
      }

      // No broken xrefs — allow the transaction
      if (orphanedRids.size === 0) {
        return true
      }

      // Second pass (old doc only): confirm the orphaned ids actually existed
      // before this transaction (i.e. they were deleted by it, not pre-existing
      // broken refs). Also collect the referenced nodes for the modal.
      const xrefGroups: XrefGroup[] = []
      state.doc.descendants((node) => {
        const id = node.attrs.id
        if (id && orphanedRids.has(id)) {
          xrefGroups.push({
            referenced: node as ManuscriptNode,
            xrefs: xrefsByRid.get(id)!.map(({ node, pos }) => [node, pos]),
          })
        }
      })

      // Orphaned rids were already broken before this transaction — allow
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

      const deletedIds = new Set(
        xrefGroups.map((g) => g.referenced.attrs.id as string)
      )

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
        // Remove cross-references that pointed to the now-deleted nodes.
        // Collect positions in reverse order so deletions don't shift
        // positions of earlier entries.
        const xrefPositions: { from: number; to: number }[] = []
        newTr.doc.descendants((node, pos) => {
          if (node.type === schema.nodes.cross_reference) {
            const rids = node.attrs.rids as string[]
            if (rids.some((rid) => deletedIds.has(rid))) {
              xrefPositions.push({ from: pos, to: pos + node.nodeSize })
            }
          }
        })
        for (let i = xrefPositions.length - 1; i >= 0; i--) {
          const { from, to } = xrefPositions[i]
          newTr.delete(from, to)
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
