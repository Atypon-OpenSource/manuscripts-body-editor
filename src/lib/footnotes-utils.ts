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

import { NodeWithPos } from 'prosemirror-utils'

/**
 *  position of new footnote could be one of these cases:
 *  * as a first child if we don't have any cited footnote
 *  * at the end of cited footnotes
 *  * or add it beside a node with a label value that is greater than the new one
 */
export const getNewFootnotePos = (
  footnotesElement: NodeWithPos,
  tablesFootnoteLabels: Map<string, number> | undefined,
  footnoteIndex: number
) => {
  // const citedFootnotes = flatten(footnotesElement.node, false).filter(
  //   ({ node }) => tablesFootnoteLabels?.has(node.attrs.id)
  // )
  // const lastChild = citedFootnotes.at(citedFootnotes.length - 1)
  // const lastChildPos =
  //   (lastChild && lastChild.pos + lastChild.node.nodeSize) || 1
  //
  // return citedFootnotes.length === 0 || footnoteIndex === 0
  //   ? 2
  //   : footnoteIndex === -1
  //   ? lastChildPos
  //   : citedFootnotes.at(footnoteIndex)?.pos || 0
  let newFootnotePos = footnotesElement.pos + footnotesElement.node.nodeSize - 1

  footnotesElement.node.descendants((node, pos, parent, index) => {
    if (footnoteIndex === ++index) {
      newFootnotePos = footnotesElement.pos + pos + 1
      return false
    }
  })

  return newFootnotePos
}
