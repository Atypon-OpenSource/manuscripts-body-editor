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
  AwardsNode,
  generateNodeID,
  ManuscriptNode,
  ManuscriptTransaction,
  schema,
  SupplementsNode,
} from '@manuscripts/transform'
import { findChildren, findChildrenByType } from 'prosemirror-utils'

export const insertAwardsNode = (tr: ManuscriptTransaction) => {
  const doc = tr.doc
  const awards = findChildrenByType(doc, schema.nodes.awards)[0]
  if (awards) {
    return awards
  }

  // Find position to insert the awards node
  const positions: number[] = []
  const possibleNodesTypes = [
    'doi',
    'keywords',
    'supplements',
    'abstracts',
    'body',
  ]
  doc.descendants((node, pos) => {
    if (possibleNodesTypes.includes(node.type.name)) {
      positions.push(pos)
    }
  })
  const pos = positions.length === 0 ? 0 : Math.min(...positions)
  // const node = schema.nodes.awards.create() as AwardsNode
  const node = schema.nodes.awards.createAndFill() as AwardsNode
  tr.insert(pos, node)
  return {
    node,
    pos,
  }
}

export const insertSupplementsNode = (tr: ManuscriptTransaction) => {
  const doc = tr.doc
  const supplements = findChildrenByType(doc, schema.nodes.supplements)[0]
  if (supplements) {
    return supplements
  }
  const abstracts = findAbstractsNode(doc)
  const pos = abstracts.pos - 1
  const node = schema.nodes.supplements.createAndFill() as SupplementsNode
  tr.insert(pos, node)
  return {
    node,
    pos,
  }
}

export const insertAttachmentsNode = (tr: ManuscriptTransaction) => {
  const attachmentsNodes = findChildrenByType(tr.doc, schema.nodes.attachments)
  if (attachmentsNodes.length) {
    return {
      node: attachmentsNodes[0].node,
      pos: attachmentsNodes[0].pos,
    }
  }
  const comments = findChildrenByType(tr.doc, schema.nodes.comments)[0]
  const pos = comments.pos + 1
  const node = schema.nodes.attachments.create({
    id: generateNodeID(schema.nodes.attachments),
  })
  tr.insert(pos, node)
  return { node, pos }
}

export const insertFootnotesSection = (tr: ManuscriptTransaction) => {
  const doc = tr.doc
  const section = findChildrenByType(doc, schema.nodes.footnotes_section)[0]
  if (section) {
    return section
  }
  const backmatter = findBackmatter(doc)
  const pos = backmatter.pos + 1
  const node = schema.nodes.footnotes_section.create({}, [
    schema.nodes.section_title.create({}, schema.text('Footnotes')),
  ])
  tr.insert(pos, node)
  return {
    node,
    pos,
  }
}

export const findAbstractsNode = (doc: ManuscriptNode) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return findChildrenByType(doc, schema.nodes.abstracts)[0]!
}

export const findBody = (doc: ManuscriptNode) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return findChildrenByType(doc, schema.nodes.body)[0]!
}

export const findBackmatter = (doc: ManuscriptNode) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return findChildrenByType(doc, schema.nodes.backmatter)[0]!
}

export const findBibliographySection = (doc: ManuscriptNode) => {
  return findChildrenByType(doc, schema.nodes.bibliography_section)[0]
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

export const findNodeByID = (doc: ManuscriptNode, id: string) => {
  const children = findChildren(doc, (n) => n.attrs.id === id)
  return children[0]
}
