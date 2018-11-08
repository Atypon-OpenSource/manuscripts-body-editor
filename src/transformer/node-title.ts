import { NodeType } from 'prosemirror-model'
import { iterateChildren } from '../lib/utils'
import { ManuscriptNode, ManuscriptNodeType } from '../schema/types'
import { nodeNames } from './node-names'

const textSnippet = (node: ManuscriptNode, max: number = 100) => {
  let text = ''

  node.forEach(child => {
    text += child.isText ? child.text : ' '
  })

  return text.substr(0, max)
}

const snippetOfNodeType = (
  node: ManuscriptNode,
  nodeType: ManuscriptNodeType
) => {
  for (const child of iterateChildren(node, true)) {
    if (child.type === nodeType) {
      return textSnippet(child)
    }
  }

  return null
}

export const nodeTitle = (node: ManuscriptNode) => {
  const nodes = node.type.schema.nodes

  switch (node.type) {
    case nodes.section:
      return snippetOfNodeType(node, nodes.section_title)

    case nodes.bibliography_section:
      return snippetOfNodeType(node, nodes.section_title)

    case nodes.ordered_list:
    case nodes.bullet_list:
      return snippetOfNodeType(node, nodes.paragraph)

    case nodes.figure_element:
    case nodes.table_element:
    case nodes.equation_element:
    case nodes.listing_element:
      return snippetOfNodeType(node, nodes.figcaption)

    default:
      return textSnippet(node)
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
