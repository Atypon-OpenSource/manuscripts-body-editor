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
  Target,
} from '@manuscripts/transform'
import { trackChangesPluginKey } from '@manuscripts/track-changes-plugin'
import isEqual from 'lodash/isEqual'
import { Node, ResolvedPos } from 'prosemirror-model'
import { NodeSelection, Plugin, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

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
      // plugins working with content silently are not the subject to a warning. Especially the Collab plugin!
      if (
        !view ||
        !tr.docChanged ||
        tr.getMeta(trackChangesPluginKey) ||
        tr.getMeta('addToHistory') === false
      ) {
        return true
      }

      // Block doc-changing transactions while modal is active - freezing to stabilize doc so same steps can be applied onConfirm
      if (modalActive) {
        return false
      }
      const targets = objectsKey.getState(state) as Map<string, Target>
      const xrefGroups = createXrefGroups(targets, state.doc, tr.doc)

      // Orphaned rids were already broken before this transaction — allow
      if (xrefGroups.length === 0) {
        return true
      }
      // Block the transaction and show a warning modal
      modalActive = true

      const cleanup = () => {
        modalActive = false
        if (modalElement) {
          modalElement.classList.remove('modal-bottom')
          modalElement.remove()
          modalElement = null
        }
      }

      const deletedIds = new Set(
        xrefGroups.map((g) => g.referenced.attrs.id as string)
      )

      const onClose = () => {
        cleanup()
      }

      if (view) {
        modalElement = openCrossRefWarningModal(
          view,
          xrefGroups,
          onConfirmCreator(view, cleanup, deletedIds, tr),
          onClose,
          selectAndScrollToCreator(view)
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

function createXrefGroups(
  targets: Map<string, Target>,
  stateDoc: ManuscriptNode,
  resultDoc: ManuscriptNode
) {
  const newIds = new Set<string>()
  const xrefRids = new Set<string>()
  const xrefGroups: XrefGroup[] = []

  resultDoc.descendants((node) => {
    if (node.attrs.id) {
      newIds.add(node.attrs.id)
    }
    if (node.type === schema.nodes.cross_reference) {
      for (const rid of node.attrs.rids as string[]) {
        xrefRids.add(rid)
      }
    }
  })

  // Find xref rids that point to ids no longer present in the resulting doc
  const orphanedRids = new Set<string>()
  for (const rid of xrefRids) {
    if (!newIds.has(rid)) {
      orphanedRids.add(rid)
    }
  }

  // No broken xrefs — allow the transaction
  if (orphanedRids.size === 0) {
    return []
  }
  // collect the referenced nodes and their xrefs with resolved positions for the modal.
  const referencedNodes = new Map<string, ManuscriptNode>()
  const xrefsByRid = new Map<string, [ManuscriptNode, ResolvedPos][]>()

  stateDoc.descendants((node, pos) => {
    const id = node.attrs.id
    if (id && orphanedRids.has(id)) {
      referencedNodes.set(id, node as ManuscriptNode)
    }
    if (node.type === schema.nodes.cross_reference) {
      for (const rid of node.attrs.rids as string[]) {
        if (orphanedRids.has(rid)) {
          let entries = xrefsByRid.get(rid)
          if (!entries) {
            entries = []
            xrefsByRid.set(rid, entries)
          }
          entries.push([node as ManuscriptNode, stateDoc.resolve(pos)])
        }
      }
    }
  })

  for (const [id, referenced] of referencedNodes) {
    const xrefs = xrefsByRid.get(id)
    if (xrefs?.length) {
      const label = targets.get(referenced.attrs.id)?.label || ''
      xrefGroups.push({ referenced, label, xrefs })
    }
  }
  return xrefGroups
}

const onConfirmCreator =
  (
    view: EditorView,
    cleanup: () => void,
    deletedIds: Set<string>,
    tr: Transaction
  ) =>
  () => {
    cleanup()
    if (!view) {
      return
    }
    // Replay the intercepted transaction's steps on the current state
    const newTr = view.state.tr
    for (const step of tr.steps) {
      const result = step.apply(newTr.doc)
      if (result.failed) {
        console.warn(
          'Cross-ref deletion warning: could not replay step —',
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

const selectAndScrollToCreator = (view: EditorView) => ($pos: ResolvedPos) => {
  if (!view) {
    return
  }

  const selTr = view.state.tr
  selTr.setSelection(NodeSelection.create(view.state.doc, $pos.pos))
  view.focus()
  view.dispatch(selTr)
  // Standard PM's scrollIntoView doesn't allow placement control - hence switching to native DOM's peer method.
  let scrollable = view.dom.parentElement

  while (
    scrollable != null &&
    scrollable.scrollHeight <= scrollable.clientHeight
  ) {
    scrollable = scrollable.parentElement
  }
  if (!scrollable) {
    return // will need more advance handling not to overlap if there is no scroll. The plethora of edge-cases suggest that the warning shouldn't be overlapping the editor really
  }
  const coords = view.coordsAtPos($pos.pos)
  const containerRect = scrollable.getBoundingClientRect()
  const offsetInContainer =
    coords.top - containerRect.top + scrollable.scrollTop
  const containerHeight = scrollable.clientHeight
  // We want the element at 75% of the container (middle of bottom half)
  const scrollTo = offsetInContainer - containerHeight * 0.75
  if (scrollTo < 0) {
    // Element is too close to the top of the document to scroll into
    // the bottom half — move the modal to the bottom instead.
    modalElement?.classList.add('modal-bottom')
    scrollable.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    modalElement?.classList.remove('modal-bottom')
    scrollable.scrollTo({ top: scrollTo, behavior: 'smooth' })
  }
}
