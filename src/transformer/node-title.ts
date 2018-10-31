import { NodeType } from 'prosemirror-model'
import { iterateChildren } from '../lib/utils'
import { ManuscriptNode } from '../schema/types'
import { nodeNames } from './node-names'

const getTextOfNodeType = (node: ManuscriptNode, nodeType: NodeType) => {
  for (const child of iterateChildren(node)) {
    if (child.type === nodeType) {
      return child.textContent
    }
  }

  return null
}

export const nodeTitle = (node: ManuscriptNode) => {
  const nodes = node.type.schema.nodes

  switch (node.type) {
    case nodes.section:
      return getTextOfNodeType(node, nodes.section_title)

    case nodes.bibliography_section:
      return getTextOfNodeType(node, nodes.section_title)

    case nodes.figure_element:
    case nodes.table_element:
    case nodes.equation_element:
    case nodes.listing_element:
      return getTextOfNodeType(node, nodes.figcaption)

    default:
      return node.textContent
  }
}

export const nodeTitlePlaceholder = (nodeType: NodeType) => {
  const nodes = nodeType.schema.nodes

  switch (nodeType) {
    case nodes.title:
      return 'Untitled Manuscript'

    case nodes.section:
      return 'Untitled Section'

    case nodes.bibliography_section:
      return 'Bibliography'

    default:
      return nodeNames.get(nodeType) || ''
  }
}
