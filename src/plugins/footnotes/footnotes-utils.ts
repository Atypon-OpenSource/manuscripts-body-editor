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
  FootnotesElementNode,
  isFootnoteNode,
  isFootnotesElementNode,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { EditorState } from 'prosemirror-state'

import { footnotesKey } from './index'

export function getNewFootnoteNumbering(
  insertedAt: number,
  state: EditorState
) {
  const currentInlineFootnotes = footnotesKey.getState(state)?.nodes || []
  // The count of footnotes before this note
  return currentInlineFootnotes.filter((n) => n[1] <= insertedAt).length + 1
}

interface NodePos {
  node: FootnotesElementNode
  pos: number
}

export const findFootnotesElement = (
  doc: ManuscriptNode
): NodePos | undefined => {
  let nodePos: NodePos | undefined = undefined

  doc.descendants((node, pos) => {
    if (isFootnotesElementNode(node)) {
      nodePos = { node, pos }
    }
  })

  return nodePos
}

export function getNewFootnoteElementPos(
  footnotesElementAndPos: NodePos,
  numbering: number
) {
  // The default is at the end of footnotes
  let foundPos =
    footnotesElementAndPos.pos + footnotesElementAndPos.node.nodeSize - 1
  // Not entirely sure why at the end position the selection has to be +2 instead of +1
  // Seems to work though although there still appears to be edge cases when the cursor
  // goes in front of the decoration which, as of 7.4.2021, renders it invisible in FireFox
  let selectionPos = foundPos + 2
  let currentNumber = 1
  footnotesElementAndPos.node.descendants((node, pos) => {
    if (isFootnoteNode(node)) {
      if (numbering === currentNumber) {
        foundPos = footnotesElementAndPos.pos + pos + 1
        selectionPos = foundPos + 1
      }
      currentNumber += 1
    }
  })
  return [foundPos, selectionPos]
}
