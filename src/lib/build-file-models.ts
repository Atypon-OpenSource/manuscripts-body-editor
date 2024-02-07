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
  encode,
  generateID,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'

export const buildFileMap = (doc: ManuscriptNode) => {
  const figures: ManuscriptNode[] = []
  const sections: ManuscriptNode[] = []
  doc.descendants((node) => {
    if (
      node.type === schema.nodes.section &&
      node.attrs.category === 'MPSectionCategory:abstract-graphical'
    ) {
      sections.push(node)
      return false
    }

    if (
      node.type === schema.nodes.figure_element ||
      node.type === schema.nodes.supplements
    ) {
      figures.push(node)
      return false
    }
  })

  sections.push(
    schema.nodes.section.create(
      { id: generateID(ObjectTypes.Section) },
      figures
    )
  )

  return encode(schema.nodes.manuscript.create({}, sections))
}
