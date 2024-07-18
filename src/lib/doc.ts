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
import {
  ManuscriptNode,
  ManuscriptTransaction,
  schema,
} from '@manuscripts/transform'
import { findChildrenByType } from 'prosemirror-utils'

export const insertSupplementsNode = (tr: ManuscriptTransaction) => {
  const doc = tr.doc
  const supplements = findChildrenByType(doc, schema.nodes.supplements)[0]
  if (supplements) {
    return supplements
  }
  const abstracts = findAbstractsNode(doc)
  const pos = abstracts.pos - 1
  tr.insert(pos, schema.nodes.supplements.create())
  return {
    node: supplements,
    pos,
  }
}

export const findAbstractsNode = (doc: ManuscriptNode) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return findChildrenByType(doc, schema.nodes.abstracts)[0]!
}

export const findGraphicalAbstractFigureElement = (doc: ManuscriptNode) => {
  const ga = findChildrenByType(doc, schema.nodes.graphical_abstract_section)[0]
  if (!ga) {
    return
  }
  const element = findChildrenByType(ga.node, schema.nodes.figure_element)[0]
  if (!element) {
    return
  }
  return {
    node: element.node,
    pos: ga.pos + element.pos + 1,
  }
}
