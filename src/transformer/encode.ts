import {
  BibliographyElement,
  Citation,
  Equation,
  EquationElement,
  FigureElement,
  Footnote,
  FootnotesElement,
  InlineMathFragment,
  ListElement,
  Listing,
  ListingElement,
  Model,
  ParagraphElement,
  Section,
  Table,
  TableElement,
  TocElement,
} from '@manuscripts/manuscripts-json-schema'
import { DOMSerializer } from 'prosemirror-model'
import { iterateChildren } from '../lib/utils'
import { schema } from '../schema'
import { isSectionNode } from '../schema/nodes/section'
import { ManuscriptNode, ManuscriptNodeType } from '../schema/types'
import { PlaceholderElement } from './models'
import { nodeTypesMap } from './node-types'
import { CITATION_ITEM } from './object-types'
import { xmlSerializer } from './serializer'

const serializer = DOMSerializer.fromSchema(schema)

const contents = (node: ManuscriptNode): string => {
  const output = serializer.serializeNode(node) as HTMLElement

  return xmlSerializer.serializeToString(output)
}

const htmlContents = (node: ManuscriptNode): string => {
  const output = serializer.serializeNode(node) as HTMLElement

  return output.outerHTML
}

export const inlineContents = (node: ManuscriptNode): string =>
  (serializer.serializeNode(node) as HTMLElement).innerHTML

const listContents = (node: ManuscriptNode): string => {
  const output = serializer.serializeNode(node) as HTMLElement

  for (const p of output.querySelectorAll('li > p')) {
    const parent = p.parentNode as HTMLLIElement

    while (p.hasChildNodes()) {
      parent.insertBefore(p.firstChild!, p)
    }

    parent.removeChild(p)
  }

  return xmlSerializer.serializeToString(output)
}

const svgDefs = (svg: string): string | undefined => {
  const fragment = document.createRange().createContextualFragment(svg)

  const defs = fragment.querySelector('defs')

  return defs ? xmlSerializer.serializeToString(defs) : undefined
}

const tags = ['thead', 'tbody', 'tfoot']

const tableRowDisplayStyle = (tagName: string, parent: ManuscriptNode) => {
  switch (tagName) {
    case 'thead':
      return parent.attrs.suppressHeader ? 'none' : 'table-header-group'

    case 'tfoot':
      return parent.attrs.suppressFooter ? 'none' : 'table-footer-group'

    default:
      return null
  }
}

const buildTableSection = (
  tagName: string,
  inputRows: NodeListOf<Element>
): HTMLTableSectionElement => {
  const section = document.createElement(tagName) as HTMLTableSectionElement

  for (const sectionRow of inputRows) {
    const row = section.appendChild(document.createElement('tr'))

    for (const child of sectionRow.children) {
      const cellType = tagName === 'thead' ? 'th' : 'td'

      const cell = row.appendChild(document.createElement(cellType))

      while (child.firstChild) {
        cell.appendChild(child.firstChild)
      }

      for (const attribute of child.attributes) {
        cell.setAttribute(attribute.name, attribute.value)
      }
    }
  }

  return section
}

const tableContents = (
  node: ManuscriptNode,
  parent: ManuscriptNode
): string => {
  const input = serializer.serializeNode(node) as HTMLTableElement

  const output = document.createElement('table')

  output.setAttribute('id', parent.attrs.id)

  output.classList.add('MPElement')

  if (parent.attrs.tableStyle) {
    output.classList.add(parent.attrs.tableStyle.replace(/:/g, '_'))
  }

  if (parent.attrs.paragraphStyle) {
    output.classList.add(parent.attrs.paragraphStyle.replace(/:/g, '_'))
  }

  output.setAttribute('data-contained-object-id', node.attrs.id)

  for (const tagName of tags) {
    const rows = input.querySelectorAll(`tr.${tagName}`)

    const section = buildTableSection(tagName, rows)

    const displayStyle = tableRowDisplayStyle(tagName, parent)

    if (displayStyle) {
      section.style.display = displayStyle
    }

    output.appendChild(section)
  }

  return xmlSerializer.serializeToString(output)
}

const childElements = (node: ManuscriptNode): ManuscriptNode[] => {
  const nodes: ManuscriptNode[] = []

  node.forEach(childNode => {
    if (!isSectionNode(childNode)) {
      nodes.push(childNode)
    }
  })

  return nodes
}

const attributeOfNodeType = (
  node: ManuscriptNode,
  type: string,
  attribute: string
): string => {
  for (const child of iterateChildren(node)) {
    if (child.type.name === type) {
      return child.attrs[attribute]
    }
  }

  return ''
}

const inlineContentsOfNodeType = (
  node: ManuscriptNode,
  nodeType: ManuscriptNodeType
): string => {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)

    if (child.type === nodeType) {
      return inlineContents(child)
    }
  }

  return ''
}

type NodeEncoder = (
  node: ManuscriptNode,
  parent: ManuscriptNode,
  path: string[],
  priority: PrioritizedValue
) => Partial<Model>

interface NodeEncoderMap {
  [key: string]: NodeEncoder
}

const encoders: NodeEncoderMap = {
  bibliography_element: (node): Partial<BibliographyElement> => ({
    elementType: 'div',
    contents: contents(node),
  }),
  bibliography_section: (node, parent, path, priority): Partial<Section> => ({
    priority: priority.value++,
    title: inlineContentsOfNodeType(node, node.type.schema.nodes.section_title),
    path: path.concat([node.attrs.id]),
    elementIDs: childElements(node)
      .map(childNode => childNode.attrs.id)
      .filter(id => id),
  }),
  bullet_list: (node): Partial<ListElement> => ({
    elementType: 'ul',
    contents: listContents(node),
    paragraphStyle: node.attrs.paragraphStyle || undefined,
  }),
  citation: (node, parent): Partial<Citation> => ({
    containingObject: parent.attrs.id, // TODO: closest parent with an id?
    // collationType: 0,
    // TODO: make this a list of bibliography item ids?
    embeddedCitationItems: node.attrs.citationItems.map((id: string) => ({
      id,
      objectType: CITATION_ITEM,
      bibliographyItem: id,
    })),
  }),
  listing: (node): Partial<Listing> => ({
    contents: inlineContents(node),
    language: node.attrs.language || undefined,
    languageKey: node.attrs.languageKey || undefined,
  }),
  listing_element: (node): Partial<ListingElement> => ({
    containedObjectID: attributeOfNodeType(node, 'listing', 'id'),
    caption: inlineContentsOfNodeType(node, node.type.schema.nodes.figcaption),
    elementType: 'figure',
    suppressCaption: node.attrs.suppressCaption === true ? undefined : false,
  }),
  equation: (node): Partial<Equation> => ({
    TeXRepresentation: node.attrs.TeXRepresentation,
    SVGStringRepresentation: node.attrs.SVGStringRepresentation,
    // title: 'Equation',
  }),
  equation_element: (node): Partial<EquationElement> => ({
    containedObjectID: attributeOfNodeType(node, 'equation', 'id'),
    caption: inlineContentsOfNodeType(node, node.type.schema.nodes.figcaption),
    elementType: 'p',
    suppressCaption: Boolean(node.attrs.suppressCaption) || undefined,
  }),
  figure_element: (node): Partial<FigureElement> => ({
    containedObjectIDs: node.attrs.containedObjectIDs,
    caption: inlineContentsOfNodeType(node, node.type.schema.nodes.figcaption),
    elementType: 'figure',
    suppressCaption: Boolean(node.attrs.suppressCaption) || undefined,
    figureStyle: node.attrs.figureStyle || undefined,
  }),
  footnote: (node, parent): Partial<Footnote> => ({
    containingObject: parent.attrs.id,
    contents: contents(node),
  }),
  footnotes_element: (node): Partial<FootnotesElement> => ({
    contents: contents(node),
    // elementType: 'div',
  }),
  inline_equation: (node, parent): Partial<InlineMathFragment> => ({
    containingObject: parent.attrs.id,
    TeXRepresentation: node.attrs.TeXRepresentation,
    SVGRepresentation: node.attrs.SVGRepresentation,
    SVGGlyphs: svgDefs(node.attrs.SVGRepresentation),
  }),
  ordered_list: (node): Partial<ListElement> => ({
    elementType: 'ol',
    contents: listContents(node),
    paragraphStyle: node.attrs.paragraphStyle,
  }),
  paragraph: (node): Partial<ParagraphElement> => ({
    elementType: 'p',
    contents: contents(node), // TODO: can't serialize citations?
    paragraphStyle: node.attrs.paragraphStyle || undefined,
  }),
  placeholder_element: (): Partial<PlaceholderElement> => ({
    elementType: 'p',
  }),
  section: (node, parent, path, priority): Partial<Section> => ({
    priority: priority.value++,
    title: inlineContentsOfNodeType(node, node.type.schema.nodes.section_title),
    path: path.concat([node.attrs.id]),
    elementIDs: childElements(node)
      .map(childNode => childNode.attrs.id)
      .filter(id => id),
    titleSuppressed: node.attrs.titleSuppressed || undefined,
  }),
  table: (node, parent): Partial<Table> => ({
    contents: tableContents(node, parent),
  }),
  table_element: (node): Partial<TableElement> => ({
    containedObjectID: attributeOfNodeType(node, 'table', 'id'),
    caption: inlineContentsOfNodeType(node, node.type.schema.nodes.figcaption),
    elementType: 'table',
    paragraphStyle: node.attrs.paragraphStyle || undefined,
    suppressCaption: Boolean(node.attrs.suppressCaption) || undefined,
    suppressFooter: Boolean(node.attrs.suppressFooter) || undefined,
    suppressHeader: Boolean(node.attrs.suppressHeader) || undefined,
    tableStyle: node.attrs.tableStyle || undefined,
  }),
  toc_element: (node): Partial<TocElement> => ({
    contents: htmlContents(node),
    // elementType: 'div',
  }),
  toc_section: (node, parent, path, priority): Partial<Section> => ({
    priority: priority.value++,
    title: inlineContentsOfNodeType(node, node.type.schema.nodes.section_title),
    path: path.concat([node.attrs.id]),
    elementIDs: childElements(node)
      .map(childNode => childNode.attrs.id)
      .filter(id => id),
  }),
}

const modelData = (
  node: ManuscriptNode,
  parent: ManuscriptNode,
  path: string[],
  priority: PrioritizedValue
): Partial<Model> => {
  const encoder = encoders[node.type.name]

  if (!encoder) throw new Error(`Unhandled model: ${node.type.name}`)

  return encoder(node, parent, path, priority)
}

export const modelFromNode = (
  node: ManuscriptNode,
  parent: ManuscriptNode,
  path: string[],
  priority: PrioritizedValue
): Model => {
  // TODO: in handlePaste, filter out non-standard IDs

  const model = {
    ...modelData(node, parent, path, priority),
    _id: node.attrs.id,
    objectType: nodeTypesMap.get(node.type)!,
  }

  return model as Model
}

interface PrioritizedValue {
  value: number
}

export const encode = (node: ManuscriptNode): Map<string, Model> => {
  const models: Map<string, Model> = new Map()

  const priority: PrioritizedValue = {
    value: 1,
  }

  const placeholders = ['placeholder', 'placeholder_element']

  const addModel = (path: string[], parent: ManuscriptNode) => (
    child: ManuscriptNode
  ) => {
    if (!child.attrs.id) return
    if (placeholders.includes(child.type.name)) return

    const model = modelFromNode(child, parent, path, priority)
    models.set(model._id, model)

    child.forEach(addModel(path.concat(child.attrs.id), child))
  }

  node.forEach(addModel([], node))

  return models
}
