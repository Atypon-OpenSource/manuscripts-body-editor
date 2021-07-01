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
  ManuscriptEditorState,
  ManuscriptEditorView,
} from '@manuscripts/manuscript-transform'
import { DiffPatcher } from 'jsondiffpatch'
import { Change } from 'prosemirror-changeset'

import { trackChangesPluginKey } from '../../../plugins/track'
import { print, recurseDeltas } from './recurseDeltas'

export class TrackChangesStore {
  view: ManuscriptEditorView
  startState: ManuscriptEditorState

  constructor(view: ManuscriptEditorView) {
    this.view = view
    this.startState = view.state
  }

  revert(change: Change) {
    const trackChangesState = trackChangesPluginKey.getState(this.view.state)
    if (!trackChangesState) {
      return
    }
    const changeSet = trackChangesState.changeSet
    const slice = changeSet.startDoc.slice(change.fromA, change.toA)
    this.view.dispatch(
      this.view.state.tr.replaceWith(change.fromB, change.toB, slice.content)
    )
  }

  diff() {
    const trackChangesState = trackChangesPluginKey.getState(this.view.state)
    if (!trackChangesState) {
      return undefined
    }
    const state = this.view.state
    const currentDoc = state.doc
    const origDoc = trackChangesState.changeSet.startDoc
    const diffPatcher = new DiffPatcher({
      objectHash(node, index) {
        return node?.attrs?.id || `$$index: ${index}`
      },
      arrays: { detectMove: true, includeValueOnMove: false },
      textDiff: { minLength: 1 },
    })
    const diff = diffPatcher.diff(origDoc?.toJSON(), currentDoc.toJSON()) || {}
    const map = new Map()
    const changeTree = recurseDeltas(
      diff,
      currentDoc,
      0,
      currentDoc,
      origDoc,
      [],
      null,
      map
    )
    // this.emit('change-tree-updated', changeTree)
    print(changeTree)
    return changeTree
  }
}
