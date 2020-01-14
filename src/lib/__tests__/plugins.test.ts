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
  Decoder,
  generateID,
  ManuscriptNode,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  Manuscript,
  Model,
  ObjectTypes,
  ParagraphElement,
  Section,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { RxAttachment } from '@manuscripts/rxdb/typings/rx-attachment'
import { createMemoryHistory } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { EditorProps } from '../../components/Editor'
import plugins from '../../plugins/editor'
import { PopperManager } from '../popper'

export interface ProjectDump {
  version: string
  data: Model[]
}

const manuscriptID = 'MPManuscript:8EB79C14-9F61-483A-902F-A0B8EF5973C9'
const containerID = 'foo'

const data = projectDump.data as Model[]

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
    priority: 1,
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
    contents: `<p class="MPElement" id="${firstParagraphID}"></p>`,
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
    contents: `<p class="MPElement" id="${secondParagraphID}"></p>`,
  }

  data.push(secondEmptyParagraph)

  const sectionID = generateID(ObjectTypes.Section)

  const section: Section = {
    _id: sectionID,
    objectType: ObjectTypes.Section,
    createdAt: 0,
    updatedAt: 0,
    sessionID: 'test',
    title: 'An empty section',
    elementIDs: [firstParagraphID, secondParagraphID],
    manuscriptID,
    containerID,
    priority: 1,
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

const buildModelMap = (doc: ProjectDump): Map<string, Model> => {
  const output: Map<string, Model> = new Map()

  doc.data.forEach(item => {
    output.set(item._id, item)
  })

  return output
}

const modelMap = buildModelMap(projectDump)

const manuscript = [...modelMap.values()].find(
  model => model.objectType === ObjectTypes.Manuscript
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
  doc: ManuscriptNode,
  modelMap: Map<string, Model>
): EditorProps => ({
  doc,
  getModel: <T extends Model>(id: string) => modelMap.get(id) as T | undefined,
  allAttachments: async (id: string) => [],
  getManuscript: () => manuscript,
  getLibraryItem: (id: string) => undefined,
  locale: 'en-US',
  modelMap,
  popper: new PopperManager(),
  manuscript,
  projectID: '',
  getCurrentUser: () => userProfile,
  history,
  renderReactComponent: (child, container) => undefined,
  unmountReactComponent: container => undefined,
  getCitationProcessor: () => undefined,
  plugins: [],
  putAttachment: async (id, attachment) => ({} as RxAttachment<Model>), // tslint:disable-line:no-object-literal-type-assertion
  removeAttachment: async (id, attachmentID) => undefined,
  deleteModel: async id => {
    modelMap.delete(id)
    return id
  },
  setLibraryItem: () => undefined,
  saveModel: async <T extends Model>() => ({} as T), // tslint:disable-line:no-object-literal-type-assertion
  filterLibraryItems: async query => [],
  subscribe: receive => undefined,
  setView: view => undefined,
  retrySync: async componentIDs => undefined,
  handleStateChange: (view, docChanged) => undefined,
  setCommentTarget: commentTarget => undefined,
  jupyterConfig: {
    url: '',
    token: '',
  },
  permissions: {
    write: true,
  },
  components: {},
  matchLibraryItemByIdentifier: item => undefined,
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

    const emptySection = view.state.doc.child(2)
    expect(emptySection.childCount).toBe(1)

    const sectionWithEmptyParagraphs = view.state.doc.child(5)
    expect(sectionWithEmptyParagraphs.childCount).toBe(3)

    const tableOfContentsSection = view.state.doc.child(0)
    expect(
      tableOfContentsSection.content.child(1).attrs.contents
    ).toMatchSnapshot()
  })

  test('loads with plugins', () => {
    const decoder = new Decoder(modelMap)
    const doc = decoder.createArticleNode()

    const state = EditorState.create<ManuscriptSchema>({
      doc,
      schema,
      plugins: plugins(buildProps(doc, modelMap)),
    })

    const view = new EditorView(undefined, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const emptySection = view.state.doc.child(1)
    expect(emptySection.childCount).toBe(2)
    expect(emptySection.content.child(0).type).toBe(
      emptySection.type.schema.nodes.section_title
    )
    expect(emptySection.content.child(1).type).toBe(
      emptySection.type.schema.nodes.paragraph
    )

    const sectionWithEmptyParagraphs = view.state.doc.child(4)
    expect(sectionWithEmptyParagraphs.childCount).toBe(2)
    expect(sectionWithEmptyParagraphs.content.child(0).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.section_title
    )
    expect(sectionWithEmptyParagraphs.content.child(1).type).toBe(
      sectionWithEmptyParagraphs.type.schema.nodes.paragraph
    )
    expect(sectionWithEmptyParagraphs.content.child(1).textContent).toBe('')

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
  })
})
