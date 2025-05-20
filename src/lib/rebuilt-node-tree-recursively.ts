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

import { compareFigureElement } from './compare-figure-element'
import { compareNodeAttrs } from './compare-node-attrs'
import { compareParagraphLike } from './compare-paragraph-like'
import { compareTableElement } from './compare-table-element'
import { compareTextLikeContent } from './compare-text-like-content'
import {
  createDeleteAttrsDataTracked,
  createInsertAttrsDataTracked,
} from './create-dataTracked-attrs'

export const rebuildProseMirrorNodeTree = (
  nodeId: string,
  nodeMap: Map<
    string,
    {
      originalNode?: ManuscriptNode
      comparisonNode?: ManuscriptNode
      children?: Map<string, any>
      status?: string
    }
  >
): ManuscriptNode => {
  const entry = nodeMap.get(nodeId)
  if (!entry) {
    throw new Error(`Node with ID "${nodeId}" not found`)
  }

  const baseNode = entry.comparisonNode ?? entry.originalNode
  if (!baseNode) {
    throw new Error(`No node available for "${nodeId}"`)
  }

  const rebuiltChildren: ManuscriptNode[] = []

  if (entry.children) {
    for (const childId of entry.children.keys()) {
      const childNode = rebuildProseMirrorNodeTree(childId, entry.children)
      rebuiltChildren.push(childNode)
    }
  }

  if (entry.status === 'deleted') {
    const finalAttrs = {
      ...baseNode.attrs,
      dataTracked: [
        createDeleteAttrsDataTracked(baseNode.attrs.id, baseNode.content),
      ],
    }
    return baseNode.type.create(
      finalAttrs,
      rebuiltChildren.length > 0 ? rebuiltChildren : baseNode.content
    )
  } else if (entry.status === 'inserted') {
    const finalAttrs = {
      ...baseNode.attrs,
      dataTracked: [
        createInsertAttrsDataTracked(baseNode.attrs.id, baseNode.content),
      ],
    }
    return baseNode.type.create(
      finalAttrs,
      rebuiltChildren.length > 0 ? rebuiltChildren : baseNode.content
    )
  } else if (
    entry.originalNode?.type.name === 'paragraph' &&
    entry.comparisonNode?.type.name === 'paragraph'
  ) {
    const comparedText = compareParagraphLike(
      entry.originalNode,
      entry.comparisonNode
    )
    return comparedText
  } else if (
    entry.originalNode?.type === schema.nodes.section_title &&
    entry.comparisonNode?.type === schema.nodes.section_title
  ) {
    const comparedText = compareTextLikeContent(
      entry.originalNode,
      entry.comparisonNode,
      schema.nodes.section_title
    )
    return comparedText
  } else if (
    entry.originalNode?.type.name === 'table_element' &&
    entry.comparisonNode?.type.name === 'table_element'
  ) {
    const comparedTable = compareTableElement(
      entry.originalNode,
      entry.comparisonNode
    )
    return comparedTable
  } else if (
    entry.originalNode?.type === schema.nodes.figure_element ||
    entry.comparisonNode?.type === schema.nodes.figure_element
  ) {
    if (entry.children) {
      const figureElementChildren = compareFigureElement(entry.children)
      return schema.nodes.figure_element.create(
        entry.comparisonNode?.attrs,
        figureElementChildren
      )
    }
  } else if (
    entry.originalNode?.type === schema.nodes.bibliography_element ||
    entry.comparisonNode?.type === schema.nodes.bibliography_element
  ) {
    const comparedBibliography = compareNodeAttrs(
      entry.comparisonNode!.attrs,
      entry.originalNode!,
      entry.comparisonNode!,
      schema.nodes.bibliography_item,
      schema.nodes.bibliography_element
    )
    return comparedBibliography
  } else if (
    entry.originalNode?.type === schema.nodes.equation_element ||
    entry.comparisonNode?.type === schema.nodes.equation_element
  ) {
    const comparedEquation = compareNodeAttrs(
      entry.comparisonNode!.attrs,
      entry.originalNode!,
      entry.comparisonNode!,
      schema.nodes.equation,
      schema.nodes.equation_element
    )
    return comparedEquation
  }

  const finalAttrs = { ...baseNode.attrs }

  return baseNode.type.create(
    finalAttrs,
    rebuiltChildren.length > 0 ? rebuiltChildren : baseNode.content
  )
}
