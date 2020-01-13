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

import { generateID, ManuscriptSchema } from '@manuscripts/manuscript-transform'
import {
  Keyword,
  Manuscript,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'

export const keywordsKey = new PluginKey('keywords')

interface Props {
  getManuscript: () => Manuscript
  getModel: <T extends Model>(id: string) => T | undefined
}

export default (props: Props) => {
  return new Plugin<undefined, ManuscriptSchema>({
    key: keywordsKey,

    appendTransaction(transactions, oldState, newState) {
      const { tr } = newState

      tr.doc.descendants((node, pos) => {
        if (node.type === node.type.schema.nodes.keywords_element) {
          const id = node.attrs.id || generateID(ObjectTypes.KeywordsElement)

          const manuscript = props.getManuscript()

          const manuscriptKeywords: Keyword[] = (manuscript.keywordIDs || [])
            .map(id => props.getModel(id))
            .filter(Boolean) as Keyword[]

          const p = document.createElement('p')
          p.classList.add('keywords')

          p.textContent = manuscriptKeywords
            .map(keyword => keyword.name)
            .join(', ')

          const contents = p.outerHTML

          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            contents,
            id,
          })

          // create a new NodeSelection
          // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
          if (tr.selection instanceof NodeSelection) {
            tr.setSelection(NodeSelection.create(tr.doc, tr.selection.from))
          }
        }
      })

      return tr
    },
  })
}
