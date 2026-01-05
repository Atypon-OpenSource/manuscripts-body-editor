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
  generateNodeID,
  isElementNodeType,
  ManuscriptEditorView,
  ManuscriptSlice,
  schema,
} from '@manuscripts/transform'
import { Fragment, Slice } from 'prosemirror-model'
import { NodeSelection, TextSelection } from 'prosemirror-state'
import { findParentNode } from 'prosemirror-utils'

import { allowedHref } from './url'
import { getDeepestSubsectionPosition } from '../components/toolbar/helpers'

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

const updateInlineFootnoteToNewRids = (
  slice: Slice,
  footnotesIdsMap: Map<string, string>
) => {
  slice.content.descendants((node) => {
    if (node.type === schema.nodes.inline_footnote) {
      // @ts-ignore
      node.attrs.rids = node.attrs.rids.map((rid) => footnotesIdsMap.get(rid))
    }
  })
}

// remove `id` from pasted content
const removeIDs = (slice: ManuscriptSlice) => {
  const footnotesIdsMap = new Map()
  slice.content.descendants((node) => {
    let id = null
    if (node.type === schema.nodes.footnote) {
      // will keep id for footnote to not lose connection with inline_footnote
      const newId = generateNodeID(node.type)
      footnotesIdsMap.set(node.attrs.id, newId)
      id = newId
    }

    if (node.attrs.id) {
      // @ts-ignore
      node.attrs.id = id
    }
  })

  updateInlineFootnoteToNewRids(slice, footnotesIdsMap)
}

const wrapInSection = (slice: ManuscriptSlice) => {
  if (slice.content.firstChild?.type === schema.nodes.section_title) {
    // @ts-ignore
    slice.content = Fragment.from(
      schema.nodes.section.create({}, slice.content)
    )
  }
}

const closeAtomSlice = (slice: ManuscriptSlice) => {
  // close slice to prevent drop of node https://github.com/ProseMirror/prosemirror-transform/blob/137ff74738bd1b50d49416cd6cfdbbf52cb059ef/src/replace.ts#L231
  if (slice.content.firstChild?.isAtom) {
    // @ts-ignore
    slice.openStart = 0
    // @ts-ignore
    slice.openEnd = 0
  }
}

export const transformPasted = (slice: ManuscriptSlice): ManuscriptSlice => {
  wrapInSection(slice)

  removeFirstParagraphIfEmpty(slice)

  removeIDs(slice)

  closeAtomSlice(slice)

  return slice
}

export const transformPastedHTML = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  wrapHeadingWithSection(doc)
  wrapTableWithFigure(doc)
  console.log(doc.body.innerHTML)
  return doc.body.innerHTML
}

const wrapHeadingWithSection = (doc: Document) => {
  if (!doc.body.querySelector('h1, h2, h3, h4, h5, h6')) {
    return
  }

  const getHeadingLevel = (element: Element) => {
    const level = element.tagName.match(/^H(\d)$/)
    return level ? parseInt(level[1]) : -1
  }

  const root = doc.createElement('div')
  const google_doc_document = doc.body.querySelector(
    'b[id^="docs-internal-guid"]'
  )
  const elements = Array.from(
    google_doc_document?.children || doc.body.children
  )
  const stack = [{ level: 0, element: root as Element }]

  for (const element of elements) {
    const headingLevel = getHeadingLevel(element)
    if (headingLevel > 0) {
      while (
        stack.length > 1 &&
        stack[stack.length - 1].level >= headingLevel
      ) {
        stack.pop()
      }
      const section = doc.createElement('section')
      section.appendChild(element.cloneNode(true))

      stack[stack.length - 1].element.appendChild(section)
      stack.push({ level: headingLevel, element: section })
    } else {
      stack[stack.length - 1].element.appendChild(element.cloneNode(true))
    }
  }

  doc.body.innerHTML = root.innerHTML
}

const wrapTableWithFigure = (doc: Document) => {
  // add figure which is table_element node in DOM
  doc.body.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.tagName !== 'FIGURE') {
      const tableElement = doc.createElement('figure')
      tableElement.className = 'table'
      table.removeAttribute('data-pm-slice')
      table.parentElement?.insertBefore(tableElement, table)
      tableElement.append(table)
    }
  })
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

  const clipboardData = event.clipboardData

  const text = clipboardData?.getData('text/plain')
  if (text && allowedHref(text)) {
    const link = schema.nodes.link.create({ href: text }, schema.text(text))
    dispatch(tr.insert(selection.from, Fragment.from(link)).scrollIntoView())
    return true
  }

  // TODO:: all the cases below should be removed when figuring out issue of open slice sides from track-changes plugin

  const parent = findParentNode(
    (node) =>
      node.type === schema.nodes.section || node.type === schema.nodes.body
  )(selection)
  if (
    (slice.content.firstChild?.type === schema.nodes.section ||
      slice.content.lastChild?.type === schema.nodes.section) &&
    parent
  ) {
    const $pos = tr.doc.resolve(
      getDeepestSubsectionPosition(parent.node, parent.pos)
    )
    const insertPos = $pos.end()
    tr.insert(insertPos, slice.content)
    dispatch(
      tr
        .setSelection(
          //@ts-ignore
          NodeSelection.create(tr.doc, tr.steps[0]['to'] || insertPos)
        )
        .scrollIntoView()
    )
    return true
  }
  if (
    (slice.content.firstChild?.type === schema.nodes.body ||
      slice.content.lastChild?.type === schema.nodes.backmatter) &&
    parent
  ) {
    const $pos = tr.doc.resolve(
      getDeepestSubsectionPosition(parent.node, parent.pos)
    )
    const insertPos = $pos.end()
    tr.insert(
      insertPos,
      slice.content.firstChild!.content.append(slice.content.lastChild!.content)
    )
    dispatch(
      tr
        .setSelection(
          NodeSelection.create(tr.doc, tr.doc.resolve(insertPos).after())
        )
        .scrollIntoView()
    )
    return true
  }

  if (
    selection instanceof TextSelection &&
    isElement(slice) &&
    slice.openStart !== 1 &&
    slice.openEnd !== 1 &&
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
    selection.$from.depth === slice.openStart &&
    selection.$anchor.parentOffset === 0 &&
    selection.$head.parentOffset === 0 &&
    selection.$from.node().type === schema.nodes.paragraph
  ) {
    const { $from, $to } = selection
    const side =
      (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to)
        .pos - 1
    if (isElement(slice) && slice.openStart !== 1 && slice.openEnd !== 1) {
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
