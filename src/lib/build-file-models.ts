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
import { ObjectTypes } from '@manuscripts/json-schema'
import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import {
  encode,
  generateID,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'

import {
  getEffectiveAttrs,
  getLatest,
} from '../plugins/bibliography/bibliography-utils'

export const buildFileMap = (doc: ManuscriptNode) => {
  const figures: ManuscriptNode[] = []
  const supplements: ManuscriptNode[] = []
  const sections: ManuscriptNode[] = []
  const buildNode = (node: ManuscriptNode, group: ManuscriptNode[]) => {
    const attrs = getEffectiveAttrs(node, true)
    if (attrs) {
      const nodeChange = (
        node.attrs.dataTracked as TrackedAttrs[] | undefined
      )?.reduce(getLatest)
      if (
        nodeChange &&
        nodeChange.operation === CHANGE_OPERATION.insert &&
        nodeChange.status === CHANGE_STATUS.rejected
      ) {
        return false
      }
      group.push(node.type.create({ ...attrs }, node.content))
    }
    return false
  }

  doc.descendants((node) => {
    if (
      node.type === schema.nodes.section &&
      node.attrs.category === 'MPSectionCategory:abstract-graphical'
    ) {
      return buildNode(node, sections)
    }

    if (node.type === schema.nodes.figure_element) {
      return buildNode(node, figures)
    }

    if (node.type === schema.nodes.supplement) {
      buildNode(node, supplements)
    }
  })

  sections.push(
    schema.nodes.section.create(
      { id: generateID(ObjectTypes.Section) },
      figures
    ),
    schema.nodes.supplements.create(
      { id: generateID(ObjectTypes.Supplement) },
      supplements
    )
  )

  return encode(schema.nodes.manuscript.create({}, sections))
}
