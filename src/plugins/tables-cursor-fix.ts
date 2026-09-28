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
import { skipTracking } from '@manuscripts/track-changes-plugin'
import { Plugin, TextSelection } from 'prosemirror-state'

/**
 * This plugins fixes cursos jump caused by tables-fixes plugin from prosemirror tables
 */
export default () => {
  return new Plugin<null>({
    appendTransaction: (transactions, oldState, newState) => {
      const tablesFixedTr = transactions.find((tr) => tr.getMeta('fix-tables$'))
      if (!tablesFixedTr) {
        return null
      }

      // const pos = tablesFixedTr.selection.$anchor.pos;
      const newTr = newState.tr
      skipTracking(newTr)
      newTr.setMeta('origin', 'tables-cursor-fix')
      newTr.setSelection(
        TextSelection.create(newState.doc, tablesFixedTr.selection.$anchor.pos)
      )

      return newTr
    },
  })
}
