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
import { schema } from '@manuscripts/transform'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'

type NumberingArray = number[]
export type PluginState = Map<string, string>

export const sectionTitleKey = new PluginKey<PluginState>('sectionNumbering')

const calculateSectionLevels = (
  node: ProseMirrorNode,
  startPos: number,
  numbering: NumberingArray = [0]
) => {
  const sectionNumberMap = new Map<string, string>()
  node.forEach((childNode, offset) => {
    if (childNode.type === schema.nodes.section) {
      numbering[numbering.length - 1] += 1
      const sectionNumber = numbering.join('.')
      const sectionStartPos = startPos + offset + 1

      childNode.forEach((innerChildNode, innerOffset) => {
        if (innerChildNode.type === schema.nodes.section_title) {
          const titleStartPos = sectionStartPos + innerOffset + 1
          sectionNumberMap.set(titleStartPos.toString(), sectionNumber)
        }
      })

      // Process child nodes to handle subsections
      const childSectionMap = calculateSectionLevels(
        childNode,
        sectionStartPos,
        [...numbering, 0]
      )
      childSectionMap.forEach((value, key) => sectionNumberMap.set(key, value))
    }
  })

  return sectionNumberMap
}

const getPluginState = (doc: ProseMirrorNode): PluginState => {
  const bodyNodes = findChildrenByType(doc, schema.nodes.body)
  const bodyNode = bodyNodes[0]
  const sectionNumberMap = calculateSectionLevels(bodyNode.node, bodyNode.pos)

  return sectionNumberMap
}

export default () => {
  return new Plugin<PluginState>({
    key: sectionTitleKey,
    state: {
      init: (_, state: EditorState) => {
        const map = getPluginState(state.doc)
        return map
      },
      apply: (
        tr: Transaction,
        oldSectionNumberMap: PluginState,
        oldState: EditorState,
        newState: EditorState
      ) => {
        if (tr.docChanged) {
          const map = getPluginState(newState.doc)
          return map
        }
        return oldSectionNumberMap
      },
    },
  })
}
