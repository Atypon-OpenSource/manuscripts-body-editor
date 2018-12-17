import { Element } from '@manuscripts/manuscripts-json-schema'
import { schema } from '../schema'
import { ManuscriptNode, ManuscriptNodeType } from '../schema/types'
import * as ObjectTypes from './object-types'

export const chooseSectionNodeType = (
  category?: string
): ManuscriptNodeType => {
  switch (category) {
    case 'MPSectionCategory:bibliography':
      return schema.nodes.bibliography_section

    case 'MPSectionCategory:toc':
      return schema.nodes.toc_section

    default:
      return schema.nodes.section
  }
}

// deprecated, every custom section should have a category
export const guessSectionCategory = (
  elements: Element[]
): string | undefined => {
  if (!elements.length) return undefined

  switch (elements[0].objectType) {
    case ObjectTypes.BIBLIOGRAPHY_ELEMENT:
      return 'MPSectionCategory:bibliography'

    case ObjectTypes.TOC_ELEMENT:
      return 'MPSectionCategory:toc'

    default:
      return undefined
  }
}

export const buildSectionCategory = (node: ManuscriptNode) => {
  switch (node.type) {
    case schema.nodes.bibliography_section:
      return 'MPSectionCategory:bibliography'

    case schema.nodes.toc_section:
      return 'MPSectionCategory:toc'

    default:
      return node.attrs.category || undefined
  }
}
