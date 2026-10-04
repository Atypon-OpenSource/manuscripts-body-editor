/*!
 * © 2026 Atypon Systems LLC
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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  ManuscriptEditorView,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import createPlugins from '../../configs/editor-plugins'
import { defaultCapabilities } from '../../testing/default-capabilities'
import { defaultEditorProps } from '../../testing/default-editor-data'
import { polyfillDom } from '../../testing/polyfill-dom'
import { ContributorAttrs } from '../authors'
import { upsertAuthor } from '../authors-and-affiliations'
import { diffText, getBio, saveBio } from '../bio'
import { findChildByID, updateNodeAttrs } from '../view'

const AUTHOR_ID = 'MPContributor:test'

const author = {
  id: AUTHOR_ID,
  given: 'Tina',
  family: 'Murray',
  priority: 0,
} as ContributorAttrs

const createView = (tracking = false) => {
  polyfillDom()
  const props = {
    ...defaultEditorProps,
    userID: 'test-user',
    getCapabilities: () => ({
      ...defaultCapabilities,
      editWithoutTracking: !tracking,
    }),
  }
  const state = EditorState.create({
    doc: props.doc,
    schema,
    plugins: createPlugins(props),
  })
  const view = new EditorView(document.createElement('div'), {
    state,
  }) as ManuscriptEditorView
  const tr = view.state.tr
  const contributors = schema.nodes.contributors.create({}, [
    schema.nodes.contributor.create(author),
  ])
  view.dispatch(skipTracking(tr.insert(0, contributors)))
  return view
}

const getContributor = (view: ManuscriptEditorView) =>
  findChildByID(view, AUTHOR_ID)?.node as ManuscriptNode

const getBioNode = (view: ManuscriptEditorView) =>
  getContributor(view).firstChild as ManuscriptNode

const getParagraph = (view: ManuscriptEditorView) =>
  getBioNode(view).lastChild as ManuscriptNode

// [text, mark names] of each text node of the bio paragraph
const getTextNodes = (view: ManuscriptEditorView) => {
  const nodes: [string, string[]][] = []
  getParagraph(view).forEach((node) => {
    nodes.push([node.text || '', node.marks.map((m) => m.type.name)])
  })
  return nodes
}

describe('diffText', () => {
  it('should find no change in equal strings', () => {
    expect(diffText('abc', 'abc')).toEqual({ start: 3, endA: 3, endB: 3 })
  })

  it('should find an insertion', () => {
    expect(diffText('Hello world', 'Hello brave world')).toEqual({
      start: 6,
      endA: 6,
      endB: 12,
    })
  })

  it('should find a deletion', () => {
    expect(diffText('Hello brave world', 'Hello world')).toEqual({
      start: 6,
      endA: 12,
      endB: 6,
    })
  })

  it('should treat everything between the first and the last change as one change', () => {
    expect(diffText('a quick brown fox', 'a slow brown cat')).toEqual({
      start: 2,
      endA: 17,
      endB: 16,
    })
  })

  it('should not overlap the common start and end', () => {
    expect(diffText('aa', 'aaa')).toEqual({ start: 2, endA: 2, endB: 3 })
    expect(diffText('aaa', 'aa')).toEqual({ start: 2, endA: 3, endB: 2 })
  })
})

describe('bio', () => {
  it('should read an empty bio from an author without bio', () => {
    const view = createView()
    expect(getBio(getContributor(view))).toEqual({ text: '', image: '' })
    expect(saveBio(view, AUTHOR_ID, { text: '', image: '' })).toBe(false)
    expect(getContributor(view).childCount).toBe(0)
  })

  it('should create the bio with the text and the image', () => {
    const view = createView()
    const values = { text: 'Professor of Biochemistry', image: 'file-1' }
    expect(saveBio(view, AUTHOR_ID, values)).toBe(true)

    const bio = getBioNode(view)
    expect(bio.type).toBe(schema.nodes.bio)
    expect(bio.firstChild?.type).toBe(schema.nodes.image_element)
    expect(bio.firstChild?.firstChild?.attrs.src).toBe('file-1')
    expect(getParagraph(view).textContent).toBe('Professor of Biochemistry')
    expect(getBio(getContributor(view))).toEqual(values)
    view.state.doc.check()
  })

  it('should create the bio without an image', () => {
    const view = createView()
    saveBio(view, AUTHOR_ID, { text: 'Professor', image: '' })
    expect(getBioNode(view).childCount).toBe(1)
    expect(getBio(getContributor(view))).toEqual({
      text: 'Professor',
      image: '',
    })
  })

  it('should not change the document when the values are the same', () => {
    const view = createView()
    const values = { text: 'Professor', image: 'file-1' }
    saveBio(view, AUTHOR_ID, values)
    const doc = view.state.doc
    expect(saveBio(view, AUTHOR_ID, values)).toBe(false)
    expect(view.state.doc).toBe(doc)
  })

  it('should add, replace and detach the image keeping the image element', () => {
    const view = createView()
    saveBio(view, AUTHOR_ID, { text: 'Professor', image: '' })

    saveBio(view, AUTHOR_ID, { text: 'Professor', image: 'file-1' })
    const image = getBioNode(view).firstChild as ManuscriptNode
    expect(image.type).toBe(schema.nodes.image_element)
    expect(image.firstChild?.attrs.src).toBe('file-1')

    saveBio(view, AUTHOR_ID, { text: 'Professor', image: 'file-2' })
    expect(getBioNode(view).firstChild?.attrs.id).toBe(image.attrs.id)
    expect(getBio(getContributor(view)).image).toBe('file-2')

    saveBio(view, AUTHOR_ID, { text: 'Professor', image: '' })
    expect(getBioNode(view).firstChild?.attrs.id).toBe(image.attrs.id)
    expect(getBio(getContributor(view))).toEqual({
      text: 'Professor',
      image: '',
    })
    expect(getParagraph(view).textContent).toBe('Professor')
    view.state.doc.check()
  })

  it('should keep the formatting of the text that was not changed', () => {
    const view = createView()
    const { pos } = findChildByID(view, AUTHOR_ID)!
    const italic = schema.marks.italic.create()
    const bio = schema.nodes.bio.create({}, [
      schema.nodes.paragraph.create({}, [
        schema.text('Agnete is a '),
        schema.text('Professor of Neurology', [italic]),
        schema.text(' at Herlev.'),
      ]),
    ])
    view.dispatch(view.state.tr.insert(pos + 1, bio))
    expect(getBio(getContributor(view)).text).toBe(
      'Agnete is a Professor of Neurology at Herlev.'
    )

    saveBio(view, AUTHOR_ID, {
      text: 'Agnete is a Professor of Neurology at Gentofte.',
      image: '',
    })
    expect(getTextNodes(view)).toEqual([
      ['Agnete is a ', []],
      ['Professor of Neurology', ['italic']],
      [' at Gentofte.', []],
    ])

    saveBio(view, AUTHOR_ID, {
      text: 'Agnete is a Professor of Clinical Neurology at Gentofte.',
      image: '',
    })
    expect(getTextNodes(view)).toEqual([
      ['Agnete is a ', []],
      ['Professor of Clinical Neurology', ['italic']],
      [' at Gentofte.', []],
    ])
  })

  it('should clear the text', () => {
    const view = createView()
    saveBio(view, AUTHOR_ID, { text: 'Professor', image: 'file-1' })
    saveBio(view, AUTHOR_ID, { text: '', image: 'file-1' })
    expect(getParagraph(view).childCount).toBe(0)
    expect(getBio(getContributor(view))).toEqual({ text: '', image: 'file-1' })
    view.state.doc.check()
  })

  it('should keep the bio when the attributes of the author are updated', () => {
    const view = createView()
    const values = { text: 'Professor', image: 'file-1' }
    saveBio(view, AUTHOR_ID, values)
    updateNodeAttrs(view, schema.nodes.contributor, {
      ...getContributor(view).attrs,
      given: 'Tina M.',
    })
    expect(getContributor(view).attrs.given).toBe('Tina M.')
    expect(getBio(getContributor(view))).toEqual(values)
  })

  it('should save the bio of an author that was just added', () => {
    const view = createView()
    const id = 'MPContributor:new'
    upsertAuthor(view, { ...author, id, priority: 1 })
    saveBio(view, id, { text: 'New author', image: '' })
    const node = findChildByID(view, id)?.node as ManuscriptNode
    expect(getBio(node)).toEqual({ text: 'New author', image: '' })
    expect(getBio(getContributor(view))).toEqual({ text: '', image: '' })
  })
})

describe('bio with track changes', () => {
  const createViewWithBio = (text: string, image = '') => {
    const view = createView(true)
    const { pos } = findChildByID(view, AUTHOR_ID)!
    const bio = schema.nodes.bio.create({}, [
      ...(image
        ? [
            schema.nodes.image_element.createAndFill(
              {},
              schema.nodes.figure.create({ src: image })
            ) as ManuscriptNode,
          ]
        : []),
      schema.nodes.paragraph.create({}, schema.text(text)),
    ])
    view.dispatch(skipTracking(view.state.tr.insert(pos + 1, bio)))
    return view
  }

  it('should track the inserted bio', () => {
    const view = createView(true)
    const values = { text: 'Professor', image: 'file-1' }
    saveBio(view, AUTHOR_ID, values)
    expect(getBioNode(view).attrs.dataTracked?.[0]).toMatchObject({
      operation: 'insert',
      status: 'pending',
    })
    expect(getBio(getContributor(view))).toEqual(values)
    view.state.doc.check()
  })

  it('should track only the changed part of the text', () => {
    const view = createViewWithBio('Hello world')

    saveBio(view, AUTHOR_ID, { text: 'Hello brave world', image: '' })
    expect(getTextNodes(view)).toEqual([
      ['Hello ', []],
      ['brave ', ['tracked_insert']],
      ['world', []],
    ])
    expect(getBio(getContributor(view)).text).toBe('Hello brave world')
  })

  it('should leave out the text that is pending deletion', () => {
    const view = createViewWithBio('Hello brave world')

    saveBio(view, AUTHOR_ID, { text: 'Hello world', image: '' })
    expect(getTextNodes(view)).toEqual([
      ['Hello ', []],
      ['brave ', ['tracked_delete']],
      ['world', []],
    ])
    expect(getBio(getContributor(view)).text).toBe('Hello world')
    // saving the same text again changes nothing
    expect(saveBio(view, AUTHOR_ID, { text: 'Hello world', image: '' })).toBe(
      false
    )

    saveBio(view, AUTHOR_ID, { text: 'Hello new world', image: '' })
    expect(getBio(getContributor(view)).text).toBe('Hello new world')
    expect(getParagraph(view).textContent).toBe('Hello new brave world')

    saveBio(view, AUTHOR_ID, { text: 'Hi', image: '' })
    expect(getBio(getContributor(view)).text).toBe('Hi')
    view.state.doc.check()
  })

  it('should replace the text that is all pending deletion', () => {
    const view = createViewWithBio('Hello')
    saveBio(view, AUTHOR_ID, { text: '', image: '' })
    expect(getTextNodes(view)).toEqual([['Hello', ['tracked_delete']]])
    expect(getBio(getContributor(view)).text).toBe('')

    saveBio(view, AUTHOR_ID, { text: 'Bye', image: '' })
    expect(getBio(getContributor(view)).text).toBe('Bye')
    view.state.doc.check()
  })

  it('should track the change of the image', () => {
    const view = createViewWithBio('Hello', 'file-1')

    saveBio(view, AUTHOR_ID, { text: 'Hello', image: 'file-2' })
    const figure = getBioNode(view).firstChild?.firstChild as ManuscriptNode
    expect(figure.attrs.src).toBe('file-2')
    expect(figure.attrs.dataTracked?.[0]).toMatchObject({
      operation: 'set_attrs',
      status: 'pending',
    })
    expect(figure.attrs.dataTracked[0].oldAttrs.src).toBe('file-1')

    saveBio(view, AUTHOR_ID, { text: 'Hello there', image: '' })
    expect(getBio(getContributor(view))).toEqual({
      text: 'Hello there',
      image: '',
    })
    saveBio(view, AUTHOR_ID, { text: 'Hello there', image: 'file-3' })
    expect(getBio(getContributor(view)).image).toBe('file-3')
    view.state.doc.check()
  })

  it('should add an image to a bio without one', () => {
    const view = createViewWithBio('Hello')
    saveBio(view, AUTHOR_ID, { text: 'Hello you', image: 'file-1' })
    expect(getBio(getContributor(view))).toEqual({
      text: 'Hello you',
      image: 'file-1',
    })
    expect(getBioNode(view).firstChild?.attrs.dataTracked?.[0]).toMatchObject({
      operation: 'insert',
    })
    view.state.doc.check()
  })
})
