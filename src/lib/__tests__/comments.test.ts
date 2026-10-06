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

import { ManuscriptEditorView, schema } from '@manuscripts/transform'
import { TextSelection, Transaction } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import { vi } from 'vitest'

import { addInlineComment, addNodeComment } from '../../commands'
import {
  createEditorState,
  createEditorView,
  EditorProps,
} from '../../configs/ManuscriptsEditor'
import { defaultCapabilities } from '../../testing/default-capabilities'
import { defaultEditorProps } from '../../testing/default-editor-data'
import { toolbar } from '../../toolbar'
import { Capabilities } from '../capabilities'
import docJson from './__fixtures__/doc.json'

const PARAGRAPH_ID = 'empty-paragraph-1'
const TEXT = 'Hello wonderful world'

const buildDoc = () => {
  const json = JSON.parse(JSON.stringify(docJson))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fill = (node: any) => {
    if (node.attrs?.id === PARAGRAPH_ID) {
      node.content = [{ type: 'text', text: TEXT }]
    }
    node.content?.forEach(fill)
  }
  fill(json)
  return schema.nodeFromJSON(json)
}

const createView = (capabilities: Partial<Capabilities>) => {
  const props = {
    ...defaultEditorProps,
    doc: buildDoc(),
    userID: 'test-user',
    getCapabilities: () => ({
      ...defaultCapabilities,
      editWithoutTracking: false,
      ...capabilities,
    }),
    onEditorClick: () => undefined,
  } as EditorProps

  const root = document.body.appendChild(document.createElement('div'))
  // eslint-disable-next-line prefer-const
  let view: ManuscriptEditorView
  const dispatch = (tr: Transaction) => {
    const state = view.state.apply(tr)
    view.updateState(state)
    return state
  }
  view = createEditorView(props, root, createEditorState(props), dispatch)
  return view
}

const selectWord = (view: ManuscriptEditorView, word: string) => {
  let start = -1
  view.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === TEXT) {
      start = pos
    }
  })
  const from = start + TEXT.indexOf(word)
  view.dispatch(
    view.state.tr.setSelection(
      TextSelection.create(view.state.doc, from, from + word.length)
    )
  )
}

const getComments = (view: ManuscriptEditorView) =>
  findChildrenByType(view.state.doc, schema.nodes.comment).map(
    (c) => c.node.attrs
  )

const getParagraph = (view: ManuscriptEditorView) =>
  findChildrenByType(view.state.doc, schema.nodes.paragraph).find(
    (p) => p.node.attrs.id === PARAGRAPH_ID
  )!.node

const getEditButton = (view: ManuscriptEditorView) =>
  view.dom.querySelector(`[id="${PARAGRAPH_ID}"] .edit-block`)

const mousedown = (element: Element) =>
  element.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, cancelable: true })
  )

// the menu is mounted on the next animation frame
const openBlockMenu = async (view: ManuscriptEditorView) => {
  mousedown(getEditButton(view) as Element)
  await new Promise((resolve) => window.requestAnimationFrame(resolve))
  return Array.from(document.querySelectorAll('.popper .menu .menu-item'))
}

describe('comments', () => {
  beforeAll(() => {
    window.scrollBy = vi.fn()
    // @ts-ignore: missing in jsdom
    window.ResizeObserver = class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('without editArticle', () => {
    const viewer = { editArticle: false, createComment: true }

    it('adds an inline comment while the view is not editable', () => {
      const view = createView(viewer)
      expect(view.editable).toBe(false)
      selectWord(view, 'wonderful')

      expect(addInlineComment(view.state, view.dispatch)).toBe(true)

      const comments = getComments(view)
      expect(comments).toHaveLength(1)
      expect(comments[0].target).toBe(PARAGRAPH_ID)
      expect(comments[0].originalText).toBe('wonderful')
      const markers = findChildrenByType(
        view.state.doc,
        schema.nodes.highlight_marker
      )
      expect(markers.map((m) => m.node.attrs.position)).toEqual([
        'start',
        'end',
      ])
      expect(view.dom.querySelector('.highlight')?.textContent).toBe(
        'wonderful'
      )
    })

    it('adds a node comment while the view is not editable', () => {
      const view = createView(viewer)

      expect(
        addNodeComment(getParagraph(view), view.state, view.dispatch)
      ).toBe(true)

      const comments = getComments(view)
      expect(comments).toHaveLength(1)
      expect(comments[0].target).toBe(PARAGRAPH_ID)
    })

    it('offers only the comment action in the block menu', async () => {
      const view = createView(viewer)
      expect(view.dom.querySelector('.add-block')).toBeNull()

      const items = await openBlockMenu(view)
      expect(items.map((item) => item.textContent)).toEqual(['Comment'])

      mousedown(items[0])
      expect(getComments(view).map((c) => c.target)).toEqual([PARAGRAPH_ID])
    })

    it('has no block menu without createComment', () => {
      const view = createView({ editArticle: false, createComment: false })
      expect(getEditButton(view)).toBeNull()
    })
  })

  describe('without createComment', () => {
    const editor = { editArticle: true, createComment: false }

    it('does not add comments', () => {
      const view = createView(editor)
      selectWord(view, 'wonderful')

      expect(addInlineComment(view.state, view.dispatch)).toBe(false)
      expect(
        addNodeComment(getParagraph(view), view.state, view.dispatch)
      ).toBe(false)
      expect(getComments(view)).toHaveLength(0)
      expect(toolbar.inline.comment.isEnabled(view.state)).toBe(false)
    })

    it('leaves the comment action out of the block menu', async () => {
      const view = createView(editor)

      const labels = (await openBlockMenu(view)).map((item) => item.textContent)
      expect(labels).toContain('Delete Paragraph')
      expect(labels).not.toContain('Comment')
    })
  })

  it('keeps the comment action next to the edit actions', async () => {
    const view = createView({ editArticle: true, createComment: true })
    selectWord(view, 'wonderful')
    expect(toolbar.inline.comment.isEnabled(view.state)).toBe(true)

    const labels = (await openBlockMenu(view)).map((item) => item.textContent)
    expect(labels).toEqual(['Comment', 'Delete Paragraph'])
  })
})
