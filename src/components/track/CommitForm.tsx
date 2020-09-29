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
import React, { useState } from 'react'

import { trackChangesKey } from '../../plugins/track'

interface Props {
  view: EditorView<ManuscriptSchema>
}

export const CommitForm: React.FC<Props> = ({ view }) => {
  const { state, dispatch } = view
  const [inputVal, setInputVal] = useState<string>('')

  if (!state) {
    return null
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    dispatch(
      state.tr.setMeta(trackChangesKey, { type: 'COMMIT', message: inputVal })
    )
    setInputVal('')
    return false
  }

  return (
    <form id="commit" onSubmit={handleSubmit}>
      <span>Editor&rsquo;s comment:</span>
      <input
        type="text"
        id="message"
        name="message"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />
      <button id="commitbutton" type="submit">
        submit
      </button>
    </form>
  )
}
