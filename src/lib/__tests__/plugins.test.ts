/*!
 * © 2019 Atypon Systems LLC
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

import projectDump from '@manuscripts/examples/data/project-dump.json'
import {
  ActualManuscriptNode,
  Decoder,
  generateID,
  hasObjectType,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  Figure,
  FigureElement,
  ListElement,
  Manuscript,
  Model,
  ObjectTypes,
  ParagraphElement,
  Section,
  Table,
  TableElement,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
// eslint-disable-next-line import/no-unresolved
import { RxAttachment } from '@manuscripts/rxdb/typings/rx-attachment'
import { createMemoryHistory } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { EditorProps } from '../../components/Editor'
import plugins from '../../plugins/editor'
import { PopperManager } from '../popper'
import { getMatchingDescendant } from '../utils'

// eslint-disable-next-line jest/no-export
export interface ProjectDump {
  version: string
  data: Model[]
}

const manuscriptID = 'MPManuscript:8EB79C14-9F61-483A-902F-A0B8EF5973C9'
const containerID = 'foo'

const data = projectDump.data as Model[]

const isSection = hasObjectType<Section>(ObjectTypes.Section)

const nextPriority = () => {
  const rootSections = data
    .filter(isSection)
    .filter((model) => model.path.length === 1)

  return rootSections.length
}

const addEmptySection = () => {
  const id = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: id,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    priority: nextPriority(),
    path: [id],
    title: 'An empty section',
    elementIDs: [],
  }

  data.push(section)
}

const addSectionWithEmptyParagraphs = () => {
  const firstParagraphID = generateID(ObjectTypes.ParagraphElement)

  const firstEmptyParagraph: ParagraphElement = {
    _id: firstParagraphID,
    objectType: ObjectTypes.ParagraphElement,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    elementType: 'p',
    contents: `<div class="MPElement" id="${firstParagraphID}"></div>`,
  }

  data.push(firstEmptyParagraph)

  const secondParagraphID = generateID(ObjectTypes.ParagraphElement)

  const secondEmptyParagraph: ParagraphElement = {
    _id: secondParagraphID,
    objectType: ObjectTypes.ParagraphElement,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    elementType: 'p',
    contents: `<div class="MPElement" id="${secondParagraphID}"></div>`,
  }

  data.push(secondEmptyParagraph)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    title: 'A section containing empty paragraphs',
    elementIDs: [firstParagraphID, secondParagraphID],
    manuscriptID,
    containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  data.push(section)
}

const addSectionWithEquationInList = () => {
  const orderedListID = generateID(ObjectTypes.ListElement)

  const orderedList: ListElement = {
    _id: orderedListID,
    objectType: ObjectTypes.ListElement,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    elementType: 'ol',
    contents: `<ul xmlns="http://www.w3.org/1999/xhtml" id="${orderedListID}" class="MPElement" data-object-type="MPListElement"><li data-placeholder-text="List item">Test <span class="MPInlineMathFragment" data-tex-representation="2+3=5"></span></li></ul>`,
  }

  data.push(orderedList)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    title: 'A section containing a list',
    elementIDs: [orderedListID],
    manuscriptID,
    containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  data.push(section)
}

const addSectionWithFigure = () => {
  const figureID = generateID(ObjectTypes.Figure)

  const figure: Figure = {
    _id: figureID,
    objectType: ObjectTypes.Figure,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
  }

  data.push(figure)

  const figureElementID = generateID(ObjectTypes.FigureElement)

  const figureElement: FigureElement = {
    _id: figureElementID,
    objectType: ObjectTypes.FigureElement,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    elementType: 'figure',
    containedObjectIDs: [figureID],
  }

  data.push(figureElement)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    title: 'A section containing a figure',
    elementIDs: [figureElementID],
    manuscriptID,
    containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  data.push(section)
}

const addSectionWithTable = () => {
  const tableID = generateID(ObjectTypes.Table)

  const table: Table = {
    _id: tableID,
    objectType: ObjectTypes.Table,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    contents: `<table xmlns="http://www.w3.org/1999/xhtml"></table>`,
  }

  data.push(table)

  const tableElementID = generateID(ObjectTypes.TableElement)

  const tableElement: TableElement = {
    _id: tableElementID,
    objectType: ObjectTypes.TableElement,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    manuscriptID,
    containerID,
    elementType: 'table',
    containedObjectID: tableID,
  }

  data.push(tableElement)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    title: 'A section containing a table',
    elementIDs: [tableElementID],
    manuscriptID,
    containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  data.push(section)
}

// add 3 empty sections
addEmptySection()
addEmptySection()
addEmptySection()

// add 3 sections with empty paragraphs
addSectionWithEmptyParagraphs()
addSectionWithEmptyParagraphs()
addSectionWithEmptyParagraphs()

// add section with paragraph and equation in list
addSectionWithEquationInList()

// add section with figure
addSectionWithFigure()

// add section with table
addSectionWithTable()

const buildModelMap = (doc: ProjectDump): Map<string, Model> => {
  const output: Map<string, Model> = new Map()

  doc.data.forEach((item) => {
    output.set(item._id, item)
  })

  return output
}

const modelMap = buildModelMap(projectDump as ProjectDump)

const manuscript = [...modelMap.values()].find(
  (model) => model.objectType === ObjectTypes.Manuscript
) as Manuscript

const userProfile: UserProfile = {
  _id: 'MPUserProfile:1',
  objectType: ObjectTypes.UserProfile,
  createdAt: 0,
  updatedAt: 0,
  bibliographicName: {
    _id: 'MPBibliographicName:1',
    objectType: ObjectTypes.BibliographicName,
  },
  userID: 'User|test@example.com',
}

const history = createMemoryHistory()

const buildProps = (
  doc: ActualManuscriptNode,
  modelMap: Map<string, Model>
): EditorProps => ({
  doc,
  getModel: <T extends Model>(id: string) => modelMap.get(id) as T | undefined,
  allAttachments: async () => [],
  getManuscript: () => manuscript,
  getLibraryItem: () => undefined,
  locale: 'en-US',
  modelMap,
  popper: new PopperManager(),
  projectID: '',
  getCurrentUser: () => userProfile,
  history,
  renderReactComponent: () => undefined,
  unmountReactComponent: () => undefined,
  getCitationProvider: () => undefined,
  plugins: [],
  putAttachment: async () => ({} as RxAttachment<Model>),
  removeAttachment: async () => undefined,
  deleteModel: async (id) => {
    modelMap.delete(id)
    return id
  },
  setLibraryItem: () => undefined,
  saveModel: async <T extends Model>() => ({} as T),
  filterLibraryItems: async () => [],
  subscribe: () => undefined,
  setView: () => undefined,
  retrySync: async () => undefined,
  handleStateChange: () => undefined,
  setCommentTarget: () => undefined,
  jupyterConfig: {
    url: '',
    token: '',
  },
  permissions: {
    write: true,
  },
  components: {},
  matchLibraryItemByIdentifier: () => undefined,
})

describe('editor view', () => {
  beforeAll(() => {
    const root = document.createElement('div')
    root.id = 'root'
    window.document.body.appendChild(root)
  })

  test('loads without plugins', () => {
    const decoder = new Decoder(modelMap)
    const doc = decoder.createArticleNode()

    const state = EditorState.create<ManuscriptSchema>({
      doc,
      schema,
    })

    const view = new EditorView(undefined, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const tableOfContentsSection = view.state.doc.child(0)
    expect(
      tableOfContentsSection.content.child(1).attrs.contents
    ).toMatchSnapshot()

    const emptySection = view.state.doc.child(4)
    expect(emptySection.childCount).toBe(1)

    const sectionWithEmptyParagraphs = view.state.doc.child(7)
    expect(sectionWithEmptyParagraphs.childCount).toBe(3)

    const sectionWithList = view.state.doc.child(10)
    expect(sectionWithList.childCount).toBe(2)
  })

  test('loads with plugins', () => {
    const decoder = new Decoder(modelMap)
    const doc = decoder.createArticleNode() as ActualManuscriptNode

    const state = EditorState.create<ManuscriptSchema>({
      doc,
      schema,
      plugins: plugins(buildProps(doc, modelMap)),
    })

    const view = new EditorView(undefined, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const tableOfContentsSection = view.state.doc.child(0)
    expect(tableOfContentsSection.type).toBe(
      tableOfContentsSection.type.schema.nodes.toc_section
    )
    expect(tableOfContentsSection.childCount).toBe(2)
    expect(tableOfContentsSection.content.child(0).type).toBe(
      tableOfContentsSection.type.schema.nodes.section_title
    )
    expect(tableOfContentsSection.content.child(1).type).toBe(
      tableOfContentsSection.type.schema.nodes.toc_element
    )

    const emptySection = view.state.doc.child(4)
    expect(emptySection.childCount).toBe(2)
    expect(emptySection.content.child(0).type).toBe(
      emptySection.type.schema.nodes.section_title
    )
    expect(emptySection.content.child(1).type).toBe(
      emptySection.type.schema.nodes.paragraph
    )

    const sectionWithEmptyParagraphs = view.state.doc.child(7)
    expect(sectionWithEmptyParagraphs.childCount).toBe(2)
    expect(sectionWithEmptyParagraphs.content.child(0).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.section_title
    )
    expect(sectionWithEmptyParagraphs.content.child(1).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.paragraph
    )
    expect(sectionWithEmptyParagraphs.content.child(1).textContent).toBe('')

    const sectionWithList = view.state.doc.child(10)
    expect(sectionWithList.childCount).toBe(2)
    expect(sectionWithList.content.child(0).type).toBe(
      sectionWithList.type.schema.nodes.section_title
    )

    const orderedList = sectionWithList.content.child(1)
    expect(orderedList.type).toBe(
      sectionWithList.type.schema.nodes.ordered_list
    )
    expect(orderedList.textContent).toBe('Test ')

    const inlineEquation = getMatchingDescendant(
      orderedList,
      (node) => node.type === node.type.schema.nodes.inline_equation
    )

    expect(inlineEquation).not.toBeUndefined()

    expect(inlineEquation!.attrs.id).toMatch(/^MPInlineMathFragment:/)

    const sectionWithFigure = view.state.doc.child(11)
    expect(sectionWithFigure.childCount).toBe(2)
    expect(sectionWithFigure.content.child(0).type).toBe(
      sectionWithFigure.type.schema.nodes.section_title
    )

    const figureElement = sectionWithFigure.content.child(1)
    expect(figureElement.childCount).toBe(3)
    expect(figureElement.type).toBe(
      figureElement.type.schema.nodes.figure_element
    )
    expect(figureElement.content.child(0).type).toBe(
      figureElement.type.schema.nodes.figure
    )
    expect(figureElement.content.child(1).type).toBe(
      figureElement.type.schema.nodes.figcaption
    )

    const sectionWithTable = view.state.doc.child(12)
    expect(sectionWithTable.childCount).toBe(2)
    expect(sectionWithTable.content.child(0).type).toBe(
      sectionWithTable.type.schema.nodes.section_title
    )

    const tableElement = sectionWithTable.content.child(1)
    expect(tableElement.childCount).toBe(3)
    expect(tableElement.type).toBe(tableElement.type.schema.nodes.table_element)
    expect(tableElement.content.child(0).type).toBe(
      tableElement.type.schema.nodes.table
    )
    expect(tableElement.content.child(1).type).toBe(
      tableElement.type.schema.nodes.figcaption
    )
  })
})
