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
import { ObjectTypes, UserProfile } from '@manuscripts/json-schema'
import { getAllPermitted } from '@manuscripts/style-guide'
import { ActualManuscriptNode, schema } from '@manuscripts/transform'
import { createMemoryHistory } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import plugins from '../../configs/editor-plugins'
import { EditorProps } from '../../configs/ManuscriptsEditor'
import { PopperManager } from '../popper'
import { getMatchingDescendant } from '../utils'
import jsonDoc from './__fixtures__/doc.json'
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
  const doc = schema.nodeFromJSON(jsonDoc) as ActualManuscriptNode
  beforeAll(() => {
    const root = document.createElement('div')
    root.id = 'root'
    window.document.body.appendChild(root)
  })

  test('loads without plugins', () => {
    const state = EditorState.create({
      doc,
      schema,
    })

    const view = new EditorView(null, { state })

    view.dispatch(view.state.tr.setMeta('update', true)) // trigger plugins

    const emptySection = view.state.doc.child(2).child(0)
    expect(emptySection.attrs.id).toBe('empty-section-1')
    expect(emptySection.childCount).toBe(1)

    const sectionWithEmptyParagraphs = view.state.doc.child(2).child(3)
    expect(sectionWithEmptyParagraphs.attrs.id).toBe(
      'section-with-empty-paragraphs-1'
    )
    expect(sectionWithEmptyParagraphs.childCount).toBe(3)

    const sectionWithList = view.state.doc.child(2).child(6)
    expect(sectionWithList.attrs.id).toBe('section-with-list')
    expect(sectionWithList.childCount).toBe(2)
  })

  test('loads with plugins', () => {
    const state = EditorState.create({
      doc,
      schema,
      plugins: plugins(buildProps(doc)),
    })

    const view = new EditorView(null, { state })

    view.dispatch(view.state.tr.setMeta('INIT', true)) // trigger plugins

    const sectionWithEmptyParagraphs = view.state.doc.child(2).child(3)
    expect(sectionWithEmptyParagraphs.attrs.id).toBe(
      'section-with-empty-paragraphs-1'
    )
    expect(sectionWithEmptyParagraphs.childCount).toBe(2)
    expect(sectionWithEmptyParagraphs.content.child(0).type).toBe(
      schema.nodes.section_title
    )
    expect(sectionWithEmptyParagraphs.content.child(1).type).toBe(
      schema.nodes.paragraph
    )
    expect(sectionWithEmptyParagraphs.content.child(1).textContent).toBe('')

    const sectionWithList = view.state.doc.child(2).child(6)
    expect(sectionWithList.attrs.id).toBe('section-with-list')
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

    const sectionWithFigure = view.state.doc.child(2).child(7)
    expect(sectionWithFigure.attrs.id).toBe('section-with-figure')
    expect(sectionWithFigure.childCount).toBe(2)
    expect(sectionWithFigure.content.child(0).type).toBe(
      schema.nodes.section_title
    )

    const figureElement = sectionWithFigure.content.child(1)
    expect(figureElement.childCount).toBe(3)
    expect(figureElement.type).toBe(schema.nodes.figure_element)
    expect(figureElement.content.child(0).type).toBe(schema.nodes.figure)
    expect(figureElement.content.child(1).type).toBe(schema.nodes.figcaption)

    const sectionWithTable = view.state.doc.child(2).child(8)
    expect(sectionWithTable.attrs.id).toBe('section-with-table')
    expect(sectionWithTable.childCount).toBe(2)
    expect(sectionWithTable.content.child(0).type).toBe(
      sectionWithTable.type.schema.nodes.section_title
    )

    const tableElement = sectionWithTable.content.child(1)
    expect(tableElement.childCount).toBe(3)
    expect(tableElement.type).toBe(tableElement.type.schema.nodes.table_element)
    expect(tableElement.content.child(0).type).toBe(
      tableElement.type.schema.nodes.figcaption
    )
    expect(tableElement.content.child(1).type).toBe(
      tableElement.type.schema.nodes.table
    )
  })
})
