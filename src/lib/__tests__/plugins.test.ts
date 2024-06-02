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
  TOCElement,
  UserProfile,
} from '@manuscripts/json-schema'
import { getAllPermitted } from '@manuscripts/style-guide'
import {
  ActualManuscriptNode,
  Decoder,
  hasObjectType,
  schema,
} from '@manuscripts/transform'
import { createMemoryHistory } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import plugins from '../../configs/editor-plugins'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import { PopperManager } from '../popper'
import { getMatchingDescendant } from '../utils'

const manuscript: Manuscript = {
  _id: 'MPManuscript:test-manuscript',
  objectType: 'MPManuscript',
  containerID: 'MPProject:test-project',
  createdAt: 0,
  updatedAt: 0,
}

const models: Model[] = [manuscript]

const isSection = hasObjectType<Section>(ObjectTypes.Section)

const nextPriority = () => {
  const rootSections = models
    .filter(isSection)
    .filter((model) => model.path.length === 1)
  return rootSections.length
}

const generateID = (type: ObjectTypes): string => {
  return type + ':model-' + models.length
}

const addEmptySection = () => {
  const id = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: id,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [id],
    title: 'An empty section',
    elementIDs: [],
  }

  models.push(section)
}

const addSectionWithEmptyParagraphs = () => {
  const firstParagraphID = generateID(ObjectTypes.ParagraphElement)

  const firstEmptyParagraph: ParagraphElement = {
    _id: firstParagraphID,
    objectType: ObjectTypes.ParagraphElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'p',
    contents: `<p class="MPElement" id="${firstParagraphID}"></p>`,
  }

  models.push(firstEmptyParagraph)

  const secondParagraphID = generateID(ObjectTypes.ParagraphElement)

  const secondEmptyParagraph: ParagraphElement = {
    _id: secondParagraphID,
    objectType: ObjectTypes.ParagraphElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'p',
    contents: `<p class="MPElement" id="${secondParagraphID}"></p>`,
  }

  models.push(secondEmptyParagraph)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    title: 'A section containing empty paragraphs',
    elementIDs: [firstParagraphID, secondParagraphID],
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  models.push(section)
}

const addSectionWithEquationInList = () => {
  const orderedListID = generateID(ObjectTypes.ListElement)

  const orderedList: ListElement = {
    _id: orderedListID,
    objectType: ObjectTypes.ListElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'ol',
    listStyleType: 'order',
    contents: `<ol xmlns="http://www.w3.org/1999/xhtml" id="${orderedListID}" class="MPElement" data-object-type="MPListElement"><li data-placeholder-text="List item">Test <span class="MPInlineMathFragment" data-tex-representation="2+3=5"></span></li></ol>`,
  }

  models.push(orderedList)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    title: 'A section containing a list',
    elementIDs: [orderedListID],
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  models.push(section)
}

const addSectionWithFigure = () => {
  const figureID = generateID(ObjectTypes.Figure)

  const figure: Figure = {
    _id: figureID,
    objectType: ObjectTypes.Figure,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
  }

  models.push(figure)

  const figureElementID = generateID(ObjectTypes.FigureElement)

  const figureElement: FigureElement = {
    _id: figureElementID,
    objectType: ObjectTypes.FigureElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'figure',
    containedObjectIDs: [figureID],
  }

  models.push(figureElement)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    title: 'A section containing a figure',
    elementIDs: [figureElementID],
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  models.push(section)
}

const addSectionWithTable = () => {
  const tableID = generateID(ObjectTypes.Table)

  const table: Table = {
    _id: tableID,
    objectType: ObjectTypes.Table,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    contents: `<table xmlns="http://www.w3.org/1999/xhtml"></table>`,
  }

  models.push(table)

  const tableElementID = generateID(ObjectTypes.TableElement)

  const tableElement: TableElement = {
    _id: tableElementID,
    objectType: ObjectTypes.TableElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'table',
    containedObjectID: tableID,
  }

  models.push(tableElement)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    title: 'A section containing a table',
    elementIDs: [tableElementID],
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  models.push(section)
}

const addSectionWithTableOfContents = () => {
  const tocElementID = generateID(ObjectTypes.TOCElement)

  const tocElement: TOCElement = {
    _id: tocElementID,
    objectType: ObjectTypes.TOCElement,
    createdAt: 0,
    updatedAt: 0,
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    elementType: 'div',
    contents: '<div>Table of Contents</div>',
  }

  models.push(tocElement)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    title: 'Table of Contents',
    elementIDs: [tocElementID],
    manuscriptID: manuscript._id,
    containerID: manuscript.containerID,
    priority: nextPriority(),
    path: [sectionID],
  }

  models.push(section)
}

// add toc section
addSectionWithTableOfContents()

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

const modelMap = new Map(
  models.map((model) => {
    return [model._id, model]
  })
)

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

const buildProps = (doc: ActualManuscriptNode): EditorProps => ({
  doc,
  getManuscript: () => manuscript,
  locale: 'en-US',
  popper: new PopperManager(),
  projectID: '',
  getCurrentUser: () => userProfile,
  history,
  setComment: () => undefined,
  setSelectedComment: () => undefined,
  setEditorSelectedSuggestion: () => undefined,
  theme: {},
  getFiles: () => [],
  fileManagement: {
    download: () => undefined, // eslint-disable-line @typescript-eslint/no-empty-function
    //@ts-ignore
    upload: () => undefined, // eslint-disable-line @typescript-eslint/no-empty-function
  },
  getCapabilities: () => getAllPermitted(),
  cslProps: {
    style: '',
    locale: '',
  },
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

    const state = EditorState.create({
      doc,
      schema,
    })

    const view = new EditorView(null, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const tableOfContentsSection = view.state.doc.child(6).child(0)

    expect(tableOfContentsSection.content.child(1).attrs.contents).toBe(
      '<div>Table of Contents</div>'
    )

    const emptySection = view.state.doc.child(6).child(1)
    expect(emptySection.childCount).toBe(1)

    const sectionWithEmptyParagraphs = view.state.doc.child(6).child(4)
    expect(sectionWithEmptyParagraphs.childCount).toBe(3)

    const sectionWithList = view.state.doc.child(6).child(7)
    expect(sectionWithList.childCount).toBe(2)
  })

  test('loads with plugins', () => {
    const decoder = new Decoder(modelMap)
    const doc = decoder.createArticleNode() as ActualManuscriptNode

    const state = EditorState.create({
      doc,
      schema,
      plugins: plugins(buildProps(doc)),
    })

    const view = new EditorView(null, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const tableOfContentsSection = view.state.doc.child(6).child(0)
    expect(
      tableOfContentsSection.content.child(1).attrs.contents
    ).toMatchSnapshot()

    const sectionWithEmptyParagraphs = view.state.doc.child(6).child(4)
    expect(sectionWithEmptyParagraphs.childCount).toBe(2)
    expect(sectionWithEmptyParagraphs.content.child(0).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.section_title
    )
    expect(sectionWithEmptyParagraphs.content.child(1).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.paragraph
    )
    expect(sectionWithEmptyParagraphs.content.child(1).textContent).toBe('')

    const sectionWithList = view.state.doc.child(6).child(7)
    expect(sectionWithList.childCount).toBe(2)
    expect(sectionWithList.content.child(0).type).toBe(
      sectionWithList.type.schema.nodes.section_title
    )

    const orderedList = sectionWithList.content.child(1)
    expect(orderedList.type).toBe(sectionWithList.type.schema.nodes.list)
    expect(orderedList.textContent).toBe('Test ')

    const inlineEquation = getMatchingDescendant(
      orderedList,
      (node) => node.type === node.type.schema.nodes.inline_equation
    )

    expect(inlineEquation).not.toBeUndefined()

    const sectionWithFigure = view.state.doc.child(6).child(8)
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

    const sectionWithTable = view.state.doc.child(6).child(9)
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
