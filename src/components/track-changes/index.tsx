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
import { ManuscriptEditorView } from '@manuscripts/manuscript-transform'
import React from 'react'
import ReactDOM from 'react-dom'

import { TrackChangesContext } from './state/TrackChangesContext'
import { TrackChangesStore } from './state/TrackChangesStore'
import { TrackChangesControls } from './TrackChangesControls'

const CONTAINER_CLASS_NAME = '__track-changes__'

function createOrFindPlace() {
  let place: HTMLElement | null = document.querySelector(
    `.${CONTAINER_CLASS_NAME}`
  )

  if (!place) {
    place = document.createElement('div')
    place.className = CONTAINER_CLASS_NAME
    document.body.appendChild(place)
  }

  return place
}

export function injectTrackChanges(view: ManuscriptEditorView) {
  const place = createOrFindPlace()
  // ReactDOM.render(<TrackChangesControls />, place)
  const store = new TrackChangesStore(view)
  ReactDOM.render(
    <TrackChangesContext.Provider
      value={{
        store,
      }}
    >
      <TrackChangesControls />
    </TrackChangesContext.Provider>,
    place
  )
}
