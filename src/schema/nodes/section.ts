import { NodeSpec } from 'prosemirror-model'
import { ManuscriptNode } from '../types'

interface Attrs {
  id: string
  titleSuppressed: boolean
}

export interface SectionNode extends ManuscriptNode {
  attrs: Attrs
}

export const section: NodeSpec = {
  // NOTE: the schema needs paragraphs to be the default type, so they must explicitly come first
  content: 'section_title (paragraph | element)* footnotes_element? section*',
  attrs: {
    id: { default: '' },
    titleSuppressed: { default: false },
  },
  group: 'block sections',
  parseDOM: [
    {
      tag: 'section',
    },
  ],
  toDOM: node => {
    const sectionNode = node as SectionNode

    return [
      'section',
      {
        id: sectionNode.attrs.id,
        class: sectionNode.attrs.titleSuppressed ? 'title-suppressed' : '',
      },
      0,
    ]
  },
}

export const isSectionNode = (node: ManuscriptNode): node is SectionNode =>
  node.type === node.type.schema.nodes.section
