import {
  BibliographyElement,
  Element,
  Equation,
  EquationElement,
  FigureElement,
  FootnotesElement,
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
import { DOMParser, ParseOptions } from 'prosemirror-model'
import { RxDocument } from 'rxdb'
import { schema } from '../schema'
import { BibliographyElementNode } from '../schema/nodes/bibliography_element'
import { EquationNode } from '../schema/nodes/equation'
import { EquationElementNode } from '../schema/nodes/equation_element'
import { FigCaptionNode } from '../schema/nodes/figcaption'
import { FigureElementNode } from '../schema/nodes/figure_element'
import { FootnotesElementNode } from '../schema/nodes/footnotes_element'
import { BulletListNode, OrderedListNode } from '../schema/nodes/list'
import { ListingNode } from '../schema/nodes/listing'
import { ListingElementNode } from '../schema/nodes/listing_element'
import { ParagraphNode } from '../schema/nodes/paragraph'
import { PlaceholderNode } from '../schema/nodes/placeholder'
import { PlaceholderElementNode } from '../schema/nodes/placeholder_element'
import { SectionNode } from '../schema/nodes/section'
import { SectionTitleNode } from '../schema/nodes/section_title'
import { TableNode } from '../schema/nodes/table'
import { TableElementNode } from '../schema/nodes/table_element'
import { TOCElementNode } from '../schema/nodes/toc_element'
import { ManuscriptNode } from '../schema/types'
import { generateNodeID } from './id'
import { PlaceholderElement, UserProfileWithAvatar } from './models'
import * as ObjectTypes from './object-types'
import { chooseSectionNodeType, guessSectionCategory } from './section-category'
import { timestamp } from './timestamp'

const parser = DOMParser.fromSchema(schema)

interface NodeCreatorMap {
  [key: string]: (data: Model) => ManuscriptNode
}

export const getModelData = <T extends Model>(model: Model): T => {
  const { _rev, _deleted, updatedAt, createdAt, sessionID, ...data } = model

  return data as T
}

export const getImageAttachment = async (doc: RxDocument<Model>) => {
  const attachment = await doc.getAttachment('image')
  if (!attachment) return undefined

  const data = await attachment.getData()
  if (!data) return undefined

  return window.URL.createObjectURL(data)
}

export const parseContents = (contents: string, options?: ParseOptions) => {
  const fragment = document.createRange().createContextualFragment(contents)

  return parser.parse(fragment.firstChild as Node, options)
}

export const buildModelMap = (
  docs: Array<RxDocument<Model>>
): Promise<Map<string, Model>> => {
  const output = new Map()

  const promises = docs.map(async doc => {
    const model = getModelData(doc.toJSON())

    if (ObjectTypes.isFigure(model)) {
      model.src = await getImageAttachment(doc)
    } else if (ObjectTypes.isUserProfile(model)) {
      ;(model as UserProfileWithAvatar).avatar = await getImageAttachment(doc)
    }

    output.set(doc._id, model)
  })

  return Promise.all(promises).then(() => output)
}

export const getModelsByType = <T extends Model>(
  modelMap: Map<string, Model>,
  objectType: string
): T[] => {
  const output: T[] = []

  for (const model of modelMap.values()) {
    if (model.objectType === objectType) {
      output.push(model as T)
    }
  }

  return output
}

export const sortSectionsByPriority = (a: Section, b: Section) =>
  a.priority === b.priority ? 0 : Number(a.priority) - Number(b.priority)

// TODO: include bibliography and toc sections
const getSections = (modelMap: Map<string, Model>) =>
  getModelsByType<Section>(modelMap, ObjectTypes.SECTION).sort(
    sortSectionsByPriority
  )

export class Decoder {
  private readonly modelMap: Map<string, Model>

  private creators: NodeCreatorMap = {
    [ObjectTypes.BIBLIOGRAPHY_ELEMENT]: data => {
      const model = data as BibliographyElement

      return schema.nodes.bibliography_element.create({
        id: model._id,
        contents: model.contents
          ? model.contents.replace(/\s+xmlns=".+?"/, '')
          : '',
      }) as BibliographyElementNode
    },
    [ObjectTypes.PLACEHOLDER_ELEMENT]: data => {
      const model = data as PlaceholderElement

      return schema.nodes.placeholder_element.create({
        id: model._id,
      }) as PlaceholderElementNode
    },
    [ObjectTypes.FIGURE_ELEMENT]: data => {
      const model = data as FigureElement

      const figcaptionNode: FigCaptionNode = schema.nodes.figcaption.create()

      const figcaption: FigCaptionNode = model.caption
        ? parseContents(`<figcaption>${model.caption}</figcaption>`, {
            topNode: figcaptionNode,
          })
        : figcaptionNode

      // TODO: actual figure nodes in here?

      return schema.nodes.figure_element.createChecked(
        {
          id: model._id,
          containedObjectIDs: model.containedObjectIDs,
          figureStyle: model.figureStyle,
          suppressCaption: Boolean(model.suppressCaption),
        },
        figcaption
      ) as FigureElementNode
    },
    [ObjectTypes.EQUATION_ELEMENT]: data => {
      const model = data as EquationElement

      const equationModel = this.getModel<Equation>(model.containedObjectID)

      const equation: EquationNode | PlaceholderNode = equationModel
        ? (schema.nodes.equation.create({
            id: equationModel._id,
            SVGStringRepresentation: equationModel.SVGStringRepresentation,
            TeXRepresentation: equationModel.TeXRepresentation,
          }) as EquationNode)
        : (schema.nodes.placeholder.create({
            id: model.containedObjectID,
            label: 'An equation',
          }) as PlaceholderNode)

      const figcaptionNode: FigCaptionNode = schema.nodes.figcaption.create()

      const figcaption: FigCaptionNode = model.caption
        ? parseContents(`<figcaption>${model.caption}</figcaption>`, {
            topNode: figcaptionNode,
          })
        : figcaptionNode

      return schema.nodes.equation_element.createChecked(
        {
          id: model._id,
          suppressCaption: model.suppressCaption,
        },
        [equation, figcaption]
      ) as EquationElementNode
    },
    [ObjectTypes.FOOTNOTES_ELEMENT]: data => {
      const model = data as FootnotesElement

      return schema.nodes.footnotes_element.create({
        id: model._id,
        contents: model.contents,
      }) as FootnotesElementNode
    },
    [ObjectTypes.LIST_ELEMENT]: data => {
      const model = data as ListElement

      switch (model.elementType) {
        case 'ol':
          // TODO: wrap inline text in paragraphs
          return parseContents(model.contents || '<ol></ol>', {
            topNode: schema.nodes.ordered_list.create({
              id: model._id,
              paragraphStyle: model.paragraphStyle,
            }),
          }) as OrderedListNode

        case 'ul':
          // TODO: wrap inline text in paragraphs
          return parseContents(model.contents || '<ul></ul>', {
            topNode: schema.nodes.bullet_list.create({
              id: model._id,
              paragraphStyle: model.paragraphStyle,
            }),
          }) as BulletListNode

        default:
          throw new Error('Unknown list element type')
      }
    },
    [ObjectTypes.LISTING_ELEMENT]: data => {
      const model = data as ListingElement

      const listingModel = this.getModel<Listing>(model.containedObjectID)

      const listing: ListingNode | PlaceholderNode = listingModel
        ? (schema.nodes.listing.create({
            id: listingModel._id,
            contents: listingModel.contents,
            language: listingModel.language,
            languageKey: listingModel.languageKey,
          }) as ListingNode)
        : (schema.nodes.placeholder.create({
            id: model.containedObjectID,
            label: 'A listing',
          }) as PlaceholderNode)

      const figcaptionNode: FigCaptionNode = schema.nodes.figcaption.create()

      const figcaption: FigCaptionNode = model.caption
        ? parseContents(`<figcaption>${model.caption}</figcaption>`, {
            topNode: figcaptionNode,
          })
        : figcaptionNode

      return schema.nodes.listing_element.createChecked(
        {
          id: model._id,
          containedFigureID: model.containedFigureID,
          suppressCaption: model.suppressCaption,
        },
        [listing, figcaption]
      ) as ListingElementNode
    },
    [ObjectTypes.PARAGRAPH]: data => {
      const model = data as ParagraphElement

      return parseContents(model.contents || '<p></p>', {
        topNode: schema.nodes.paragraph.create({
          id: model._id,
          paragraphStyle: model.paragraphStyle,
          placeholder: model.placeholderInnerHTML,
        }),
      }) as ParagraphNode
    },
    [ObjectTypes.SECTION]: data => {
      const model = data as Section

      const elements: Element[] = []

      if (model.elementIDs) {
        for (const id of model.elementIDs) {
          const element = this.getModel<Element>(id)

          if (element) {
            elements.push(element)
          } else {
            const placeholderElement: PlaceholderElement = {
              _id: id,
              containerID: model._id,
              elementType: 'p',
              objectType: ObjectTypes.PLACEHOLDER_ELEMENT,
              createdAt: timestamp(),
              updatedAt: timestamp(),
            }

            elements.push(placeholderElement)
          }
        }
      }

      const elementNodes = elements.map(this.decode)

      const sectionTitleNode: SectionTitleNode = model.title
        ? parseContents(`<h1>${model.title}</h1>`, {
            topNode: schema.nodes.section_title.create(),
          })
        : schema.nodes.section_title.create()

      const nestedSections = getSections(this.modelMap)
        .filter(section => section.path && section.path.length > 1)
        .filter(section => section.path[section.path.length - 2] === model._id)
        .map(this.creators[ObjectTypes.SECTION]) as SectionNode[]

      const sectionCategory = model.category || guessSectionCategory(elements)

      const sectionNodeType = chooseSectionNodeType(sectionCategory)

      const sectionNode = sectionNodeType.createAndFill(
        {
          id: model._id,
          category: sectionCategory,
          titleSuppressed: model.titleSuppressed,
        },
        [sectionTitleNode].concat(elementNodes).concat(nestedSections)
      )

      if (!sectionNode) {
        console.error(model) // tslint:disable-line:no-console
        throw new Error('Invalid content for section ' + model._id)
      }

      return sectionNode as SectionNode
    },
    [ObjectTypes.TABLE_ELEMENT]: data => {
      const model = data as TableElement

      const tableModel = this.getModel<Table>(model.containedObjectID)

      const table: TableNode | PlaceholderNode = tableModel
        ? (parseContents(tableModel.contents, {
            topNode: schema.nodes.table.create({
              id: tableModel._id,
            }),
          }) as TableNode)
        : (schema.nodes.placeholder.create({
            id: model.containedObjectID,
            label: 'A table',
          }) as PlaceholderNode)

      const figcaptionNode: FigCaptionNode = schema.nodes.figcaption.create()

      const figcaption: FigCaptionNode = model.caption
        ? parseContents(`<figcaption>${model.caption}</figcaption>`, {
            topNode: figcaptionNode,
          })
        : figcaptionNode

      return schema.nodes.table_element.createChecked(
        {
          id: model._id,
          table: model.containedObjectID,
          suppressCaption: model.suppressCaption,
          suppressFooter: model.suppressFooter,
          suppressHeader: model.suppressHeader,
          tableStyle: model.tableStyle,
          paragraphStyle: model.paragraphStyle,
        },
        [table, figcaption]
      ) as TableElementNode
    },
    [ObjectTypes.TOC_ELEMENT]: data => {
      const model = data as TocElement

      return schema.nodes.toc_element.create({
        id: model._id,
        contents: model.contents,
      }) as TOCElementNode
    },
  }

  constructor(modelMap: Map<string, Model>) {
    this.modelMap = modelMap
  }

  public decode = (model: Model) => {
    if (!this.creators[model.objectType]) {
      throw new Error('No converter for ' + model.objectType)
    }

    return this.creators[model.objectType](model)
  }

  public getModel = <T extends Model>(id: string): T | undefined =>
    this.modelMap.get(id) as T | undefined

  public createArticleNode = () => {
    const rootSections = getSections(this.modelMap).filter(
      section => section.path.length <= 1
    )

    const rootSectionNodes = rootSections.map(this.decode) as SectionNode[]

    if (!rootSectionNodes.length) {
      rootSectionNodes.push(schema.nodes.section.createAndFill({
        id: generateNodeID(schema.nodes.section),
      }) as SectionNode)
    }

    return schema.nodes.manuscript.create({}, rootSectionNodes)
  }
}
