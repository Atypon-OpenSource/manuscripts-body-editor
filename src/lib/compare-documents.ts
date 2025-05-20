/*!
 * © 2025 Atypon Systems LLC
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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { NodeType } from 'prosemirror-model'
import { findChildrenByType } from 'prosemirror-utils'

import { ManuscriptSnapshot } from '../components/tools/CompareDocumentsModal'
import { compareNodeAttrs } from './compare-node-attrs'
import { compareNodeById } from './compare-node-by-id'
import { compareTextLikeContent } from './compare-text-like-content'
import {
  createDeleteAttrsDataTracked,
  createInsertAttrsDataTracked,
} from './create-dataTracked-attrs'
import { distributeNodesForComparison, NodeComparison } from './distrubte-nodes'
import { rebuildProseMirrorNodeTree } from './rebuilt-node-tree-recursively'
export const compareDocuments = (
  originalSnapshot: ManuscriptSnapshot,
  comparisonSnapshot: ManuscriptSnapshot
) => {
  const originalDocument = schema.nodeFromJSON(originalSnapshot.snapshot)
  const comparisonDocument = schema.nodeFromJSON(comparisonSnapshot.snapshot)

  const originalTopLevelNodes = extractTopLevelNodes(originalDocument)
  const comparisonTopLevelNodes = extractTopLevelNodes(comparisonDocument)
  const distributedNodes = distributeNodesForComparison(
    originalTopLevelNodes,
    comparisonTopLevelNodes
  )

  const comparedNodes: ManuscriptNode[] = []

  for (const [
    key,
    { originalNode, comparisonNode, children, status },
  ] of distributedNodes.entries()) {
    if (status === 'deleted') {
      const finalAttrs = {
        ...originalNode!.attrs,
        dataTracked: [createDeleteAttrsDataTracked('', originalNode!.attrs)],
      }
      comparedNodes.push(
        originalNode!.type.create(finalAttrs, originalNode!.content)
      )
    } else if (
      status === 'inserted' &&
      comparisonNode?.type !== schema.nodes.keywords
    ) {
      const finalAttrs = {
        ...comparisonNode!.attrs,
        dataTracked: [createInsertAttrsDataTracked('', comparisonNode!.attrs)],
      }
      comparedNodes.push(
        comparisonNode!.type.create(finalAttrs, comparisonNode!.content)
      )
    } else if (
      originalNode?.type === schema.nodes.title ||
      comparisonNode?.type === schema.nodes.title
    ) {
      const comparedTitle = compareTitles(originalNode!, comparisonNode!)
      comparedNodes.push(comparedTitle)
    } else if (
      originalNode?.type === schema.nodes.contributors ||
      comparisonNode?.type === schema.nodes.author
    ) {
      const comparedAuthor = compareNodeAttrs(
        comparisonNode!.attrs,
        originalNode!,
        comparisonNode!,
        schema.nodes.contributor,
        schema.nodes.contributors
      )
      comparedNodes.push(comparedAuthor)
    } else if (
      originalNode?.type === schema.nodes.affiliations ||
      comparisonNode?.type === schema.nodes.affiliations
    ) {
      const comparedAffiliations = compareNodeAttrs(
        comparisonNode!.attrs,
        originalNode!,
        comparisonNode!,
        schema.nodes.affiliation,
        schema.nodes.affiliations
      )
      comparedNodes.push(comparedAffiliations)
    } else if (
      originalNode?.type === schema.nodes.keywords ||
      comparisonNode?.type === schema.nodes.keywords
    ) {
      comparedNodes.push(
        compareKeywords(originalNode!, comparisonNode!, status)
      )
    } else if (
      originalNode?.type === schema.nodes.abstracts ||
      comparisonNode?.type === schema.nodes.abstracts
    ) {
      const comparedAbstracts = compareSectionNodes(
        comparisonNode!.attrs,
        children!,
        schema.nodes.abstracts
      )
      comparedNodes.push(comparedAbstracts)
    } else if (
      originalNode?.type === schema.nodes.body ||
      comparisonNode?.type === schema.nodes.body
    ) {
      const comparedBody = compareSectionNodes(
        comparisonNode!.attrs,
        children!,
        schema.nodes.body
      )
      comparedNodes.push(comparedBody)
    } else if (
      originalNode?.type === schema.nodes.backmatter ||
      comparisonNode?.type === schema.nodes.backmatter
    ) {
      const comparedBackmatter = compareSectionNodes(
        comparisonNode!.attrs,
        children!,
        schema.nodes.backmatter
      )
      comparedNodes.push(comparedBackmatter)
    } else {
      comparedNodes.push(comparisonNode || originalNode!)
    }
  }
  const manuscript = schema.nodes.manuscript.create(
    comparisonDocument.attrs,
    comparedNodes
  )

  return manuscript
}

const extractTopLevelNodes = (document: ManuscriptNode) => {
  const topLevelNodes: ManuscriptNode[] = []
  document.content.forEach((node) => {
    topLevelNodes.push(node)
  })
  return topLevelNodes
}

const compareTitles = (
  originalTitle: ManuscriptNode,
  comparisonTitle: ManuscriptNode
) => compareTextLikeContent(originalTitle, comparisonTitle, schema.nodes.title)

const compareKeywords = (
  originalKeywords: ManuscriptNode,
  comparisonKeywords: ManuscriptNode,
  status?: string
) => {
  const comparisonKeywordsGroup = findChildrenByType(
    comparisonKeywords,
    schema.nodes.keyword_group
  )[0].node
  const comparisonKeywordsElement = comparisonKeywordsGroup.content.content.map(
    (keyword) => keyword
  )
  const sectionTitle = findChildrenByType(
    comparisonKeywords,
    schema.nodes.section_title
  )[0].node
  const keywordsElementNode = findChildrenByType(
    comparisonKeywords,
    schema.nodes.keywords_element
  )[0].node

  if (status === 'inserted') {
    const KeywordsAttrs = {
      ...comparisonKeywords.attrs,
      dataTracked: [createInsertAttrsDataTracked('', comparisonKeywords.attrs)],
    }
    const keywordsElementAttrs = {
      ...keywordsElementNode.attrs,
      dataTracked: [
        createInsertAttrsDataTracked('', keywordsElementNode.attrs),
      ],
    }
    const keywordsGroupAttrs = {
      ...comparisonKeywordsGroup.attrs,
      dataTracked: [
        createInsertAttrsDataTracked('', comparisonKeywordsGroup.attrs),
      ],
    }
    const sectionTitleAttrs = {
      ...sectionTitle.attrs,
      dataTracked: [createInsertAttrsDataTracked('', sectionTitle.attrs)],
    }

    return schema.nodes.keywords.create(KeywordsAttrs, [
      schema.nodes.section_title.create(
        sectionTitleAttrs,
        sectionTitle.content
      ),
      schema.nodes.keywords_element.create(
        keywordsElementAttrs,
        schema.nodes.keyword_group.create(
          keywordsGroupAttrs,
          comparisonKeywordsGroup.content
        )
      ),
    ])
  }
  const keywordsElementGroup = findChildrenByType(
    originalKeywords,
    schema.nodes.keyword_group
  )[0].node
  const keywordsElement = keywordsElementGroup.content.content.map(
    (keyword) => keyword
  )
  const diffs: ManuscriptNode[] = compareNodeById(
    keywordsElement,
    comparisonKeywordsElement,
    schema.nodes.keyword
  )
  return schema.nodes.keywords.create(originalKeywords.attrs, [
    sectionTitle,
    schema.nodes.keywords_element.create(
      keywordsElementNode.attrs,
      schema.nodes.keyword_group.create(keywordsElementGroup.attrs, diffs)
    ),
  ])
}

const compareSectionNodes = (
  comparisonNodeAttrs: any,
  childrenMap: Map<string, NodeComparison>,
  sectionNodeType: NodeType
) => {
  const childNodes: ManuscriptNode[] = []
  for (const [key] of childrenMap.entries()) {
    const rebuilt = rebuildProseMirrorNodeTree(key, childrenMap)
    childNodes.push(rebuilt)
  }
  return sectionNodeType.create(comparisonNodeAttrs, childNodes)
}
