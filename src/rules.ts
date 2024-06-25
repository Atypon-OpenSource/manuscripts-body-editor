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

import { schema } from '@manuscripts/transform'
import {
  ellipsis,
  emDash,
  InputRule,
  inputRules,
  smartQuotes,
} from 'prosemirror-inputrules'
import { Node as ProsemirrorNode, NodeType } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

const creatingInputRule = (regexp: RegExp, nodeType: NodeType) =>
  new InputRule(regexp, (state, match, start, end) => {
    const tr = state.tr.delete(start, end)
    const range = tr.doc.resolve(start).blockRange()
    if (range) {
      const node = nodeType.createAndFill() as ProsemirrorNode
      tr.replaceRangeWith(range.start, range.end, node)
      const $anchor = tr.doc.resolve(range.start)
      tr.setSelection(TextSelection.between($anchor, $anchor))
      return tr
    }
    return null
  })

export default inputRules({
  rules: [
    ...smartQuotes,
    ellipsis,
    emDash,

    // * bullet | ordered list
    creatingInputRule(/^(\d+[.)]\s|\s*\*\s)$/, schema.nodes.list),

    // > blockquote
    creatingInputRule(/^\s*>\s$/, schema.nodes.blockquote_element),

    // ``` listing
    creatingInputRule(/^```$/, schema.nodes.listing_element),

    // # section (heading)
    creatingInputRule(/^#\s$/, schema.nodes.section),
  ],
})
