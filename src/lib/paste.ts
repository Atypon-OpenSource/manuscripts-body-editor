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
  isElementNodeType,
  ManuscriptEditorView,
  ManuscriptSlice,
  schema,
} from '@manuscripts/transform'
import { Fragment, Slice } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { findParentNode } from 'prosemirror-utils'

const removeFirstParagraphIfEmpty = (slice: ManuscriptSlice) => {
  const firstChild = slice.content.firstChild

  if (
    firstChild &&
    firstChild.type === firstChild.type.schema.nodes.paragraph &&
    firstChild.textContent === ''
  ) {
    // @ts-ignore
    slice.content = slice.content.cut(firstChild.nodeSize)
  }
}

// remove `id` from pasted content
const removeIDs = (slice: ManuscriptSlice) => {
  slice.content.descendants((node) => {
    if (node.attrs.id) {
      // @ts-ignore
      node.attrs.id = null
    }
  })
}

const wrapInSection = (slice: ManuscriptSlice) => {
  if (slice.content.firstChild?.type === schema.nodes.section_title) {
    // @ts-ignore
    slice.content = Fragment.from(
      schema.nodes.section.create({}, slice.content)
    )
  }
}

export const transformPasted = (slice: ManuscriptSlice): ManuscriptSlice => {
  wrapInSection(slice)

  removeFirstParagraphIfEmpty(slice)

  removeIDs(slice)

  return slice
}

export const transformPastedHTML = (html: string) => {
  // add figure which is table_element node in DOM
  if (html.includes('table')) {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.tagName !== 'figure') {
        const tableElement = document.createElement('figure')
        tableElement.className = 'table'
        table.removeAttribute('data-pm-slice')
        table.parentElement?.insertBefore(tableElement, table)
        tableElement.append(table)
      }
    })
    return doc.body.innerHTML
  }
  return html
}

export const handlePaste = (
  view: ManuscriptEditorView,
  event: ClipboardEvent,
  slice: Slice
) => {
  if (event.type !== 'paste') {
    return false
  }

  const {
    state: { tr, selection },
    dispatch,
  } = view

  tr.setMeta('uiEvent', 'paste')
  tr.setMeta('paste', true)

  const parent = findParentNode((node) => node.type === schema.nodes.section)(
    tr.selection
  )
  if (slice.content.firstChild?.type === schema.nodes.section && parent) {
    const $pos = tr.doc.resolve(parent.start)
    const insertPos = $pos.after($pos.depth)
    tr.insert(insertPos, slice.content)
    dispatch(
      tr.setSelection(TextSelection.create(tr.doc, insertPos)).scrollIntoView()
    )
    return true
  }

  if (
    selection instanceof TextSelection &&
    isElement(slice) &&
    selection.$anchor.parentOffset > 0 &&
    selection.$head.parentOffset > 0 &&
    selection.$from.node().type === schema.nodes.paragraph
  ) {
    const { $from, $to } = selection
    const side = (
      !$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to
    ).pos
    // will use closed sides for elements(list) as in prosemirror-transform Fitter will
    // join content in the element with side we need to insert depending on the schema,
    // so for list first list item will be joined and that will make it hard for us
    // to tracked and required changes in the schema
    tr.replace(side, side, new Slice(slice.content, 0, 0))
    dispatch(
      tr.setSelection(TextSelection.create(tr.doc, side + 1)).scrollIntoView()
    )
    return true
  }

  if (
    selection instanceof TextSelection &&
    selection.$anchor.parentOffset === 0 &&
    selection.$head.parentOffset === 0 &&
    selection.$from.node().type === schema.nodes.paragraph
  ) {
    const { $from, $to } = selection
    const side =
      (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to)
        .pos - 1
    if (isElement(slice)) {
      tr.replace(side, side, new Slice(slice.content, 0, 0))
    } else {
      tr.replace(side, side, slice)
    }
    dispatch(
      tr.setSelection(TextSelection.create(tr.doc, side + 1)).scrollIntoView()
    )
    return true
  }

  return false
}

const isElement = (slice: Slice) => {
  const { firstChild, lastChild } = slice.content
  return (
    (firstChild &&
      isElementNodeType(firstChild.type) &&
      firstChild.type !== schema.nodes.paragraph) ||
    (lastChild &&
      isElementNodeType(lastChild.type) &&
      lastChild.type !== schema.nodes.paragraph)
  )
}
