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
  isInGraphicalAbstractSection,
  ManuscriptEditorState,
  ManuscriptEditorView,
  schema,
} from '@manuscripts/transform'
import { chainCommands } from 'prosemirror-commands'
import { Fragment, ResolvedPos, Slice } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

import {
  autoComplete,
  Dispatch,
  isAtEndOfTextBlock,
  isAtStartOfTextBlock,
  isTextSelection,
} from '../commands'
import { EditorAction } from '../types'

const insertParagraph = (
  dispatch: Dispatch,
  state: ManuscriptEditorState,
  $anchor: ResolvedPos
) => {
  const {
    tr,
    schema: { nodes },
  } = state

  const offset = $anchor.nodeAfter ? $anchor.nodeAfter.nodeSize : 0
  const pos = $anchor.pos + offset + 1
  const nextNode = tr.doc.resolve(pos).nodeAfter

  if (
    !nextNode ||
    nextNode.type !== nextNode.type.schema.nodes.paragraph ||
    nextNode.nodeSize > 2
  ) {
    tr.insert(pos, nodes.paragraph.create())
  }

  tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView()

  dispatch(tr)
}

const leaveTitle: EditorAction = (state, dispatch, view) => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }

  const { $cursor } = selection

  if (!$cursor) {
    return false
  }

  const titleTypes = [
    schema.nodes.alt_title,
    schema.nodes.section_title,
    schema.nodes.title,
  ]

  if (!titleTypes.includes($cursor.parent.type)) {
    return false
  }

  if ($cursor.parent.type === schema.nodes.alt_title) {
    return true
  }

  if (isInGraphicalAbstractSection($cursor)) {
    return false
  }

  if (!isAtEndOfTextBlock(state, $cursor, view)) {
    return false
  }

  if (dispatch) {
    insertParagraph(dispatch, state, $cursor)
  }

  return true
}

const leaveFigcaption: EditorAction = (state) => {
  const {
    selection: { $anchor },
  } = state

  return $anchor.parent.type === $anchor.parent.type.schema.nodes.caption_title
}

// ignore backspace at the start of section titles
const protectTitles: EditorAction = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch,
  view?: ManuscriptEditorView
) => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }

  const { $cursor } = selection

  if (!$cursor) {
    return false
  }

  // preventing deletion of alt_titles and subtitles with backspace
  if (
    ($cursor.parent.type === schema.nodes.alt_title ||
      $cursor.parent.type === schema.nodes.subtitle) &&
    $cursor.pos === $cursor.before() + 1
  ) {
    return true
  }

  return (
    $cursor.parent.type === $cursor.parent.type.schema.nodes.section_title &&
    isAtStartOfTextBlock(state, $cursor, view)
  )
}

export const protectReferencesTitle = (state: ManuscriptEditorState) => {
  const { selection } = state

  if (!isTextSelection(selection)) {
    return false
  }
  const { $from } = selection
  const parentNode = $from.node($from.depth - 1)
  return (
    $from.parent.type === schema.nodes.section_title &&
    parentNode.type === schema.nodes.bibliography_section
  )
}

const protectCaption: EditorAction = (
  state: ManuscriptEditorState,
  dispatch?: Dispatch
) => {
  const {
    selection: { $anchor },
  } = state

  if (
    dispatch &&
    ($anchor.parent.type === $anchor.parent.type.schema.nodes.caption_title ||
      $anchor.parent.type === $anchor.parent.type.schema.nodes.caption) &&
    $anchor.parent.content.size === 1
  ) {
    const slice = new Slice(
      Fragment.from([state.schema.nodes.caption_title.create()]),
      1,
      1
    )
    const tr = state.tr.replace($anchor.pos - 1, $anchor.pos, slice)
    dispatch(tr)

    return true
  }

  return false
}

const keepCaption = (state: ManuscriptEditorState) => {
  const {
    selection: { $anchor },
  } = state
  return (
    $anchor.parent.type === $anchor.parent.type.schema.nodes.caption_title &&
    $anchor.parent.content.size === 0
  )
}

const titleKeymap: { [key: string]: EditorAction } = {
  Backspace: chainCommands(
    protectTitles,
    protectReferencesTitle,
    protectCaption
  ),
  Enter: chainCommands(autoComplete, leaveTitle, leaveFigcaption),
  Delete: chainCommands(keepCaption, protectReferencesTitle),
}

export default titleKeymap
