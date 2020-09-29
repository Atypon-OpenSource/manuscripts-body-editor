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

import { ManuscriptSchema } from '@manuscripts/manuscript-transform'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { trackChangesKey, TrackPluginState } from '../../plugins/track'

interface Props {
  view: EditorView<ManuscriptSchema>
}

export const CommitsList: React.FC<Props> = ({ view }) => {
  const { state, dispatch } = view

  if (!state) {
    return null
  }

  const { tracked } = trackChangesKey.getState(state) as TrackPluginState
  const { commits } = tracked

  return (
    <div>
      {commits.map((commit, i) => (
        <div
          className="commit"
          key={commit.id}
          onClick={(e) => {
            e.preventDefault()
            const { tr } = state
            tr.setMeta(trackChangesKey, { type: 'FOCUS', commit: i })
            dispatch(tr)
          }}
        >
          {commit.message}
        </div>
      ))}
    </div>
  )
}
