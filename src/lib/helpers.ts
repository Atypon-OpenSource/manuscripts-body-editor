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
  ManuscriptEditorState,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { Node, ResolvedPos } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'

export const isNodeOfType =
  (...type: string[]) =>
  (node: Node): boolean => {
    const [head, ...tail] = type
    if (node.type === node.type.schema.nodes[head]) {
      return true
    }
    if (tail && tail.length) {
      return isNodeOfType(...tail)(node)
    }
    return false
  }

export const nearestAncestor =
  (func: (node: ManuscriptNode) => boolean) =>
  ($pos: ResolvedPos): number | null => {
    for (let d = $pos.depth; d >= 0; d--) {
      if (func($pos.node(d))) {
        return d
      }
    }
    return null
  }

// This function finds and merges similar items in an array.
// It uses a compare function to determine which items in the array
// are similar (or identical), and if a match is found, uses the mergeFunc
// to merge it with the match.
export const mergeSimilarItems =
  <T>(compareFunc: (a: T, b: T) => boolean, mergeFunc: (a: T, b: T) => T) =>
  (items: T[]): T[] => {
    return items.reduce((acc: T[], item: T) => {
      const existingIndex = acc.findIndex((existing) =>
        compareFunc(existing, item)
      )
      if (existingIndex === -1) {
        return [...acc, item]
      }
      return [
        ...acc.slice(0, existingIndex),
        mergeFunc(acc[existingIndex], item),
        ...acc.slice(existingIndex + 1),
      ]
    }, [])
  }

export const handleScrollToSelectedTarget = (view: EditorView): boolean => {
  const { tr, selection } = view.state

  // Get the nodes at the selection's start and end positions
  const nodeAtFrom = tr.doc.nodeAt(selection.$from.pos)
  const nodeAtTo = tr.doc.nodeAt(selection.$to.pos)
  // Get the DOM element at the selection's position
  const domAtSelectionFrom = view.domAtPos(selection.$from.pos)
    .node as HTMLElement

  if (!nodeAtFrom) {
    return false
  }

  // Determine the target element to scroll to
  const targetElement =
    nodeAtFrom.type === schema.nodes.bibliography_item
      ? (document.getElementById(nodeAtFrom.attrs.id) as HTMLElement)
      : nodeAtTo?.type === schema.nodes.highlight_marker
      ? (document.getElementById(nodeAtTo?.attrs.id) as HTMLElement)
      : (document.getElementById(nodeAtFrom.attrs.id) as HTMLElement)

  // Fallback to the DOM element at the selection's position
  const scrollTarget = targetElement || domAtSelectionFrom

  if (!scrollTarget) {
    return false
  }

  // Highlight the footnote marker if applicable
  if (nodeAtFrom.type === schema.nodes.inline_footnote) {
    const resolvedPos = view.state.doc.resolve(selection.$from.pos)
    const targetNode = view.nodeDOM(resolvedPos.pos) as HTMLElement

    if (targetNode) {
      // Add the highlight class to the exact DOM node
      targetNode.classList.add('highlight-footnote-marker')
      setTimeout(
        () => targetNode.classList.remove('highlight-footnote-marker'),
        3000
      )
    }
  }

  // Set block alignment based on the node type
  const blockAlignment =
    nodeAtFrom.type === schema.nodes.bibliography_item ? 'center' : 'start'

  // Scroll the target element into view
  scrollTarget.scrollIntoView({
    behavior: 'smooth',
    block: blockAlignment,
  })

  return true
}

// Find the boundaries of the intended word based on the current cursor position
export const findWordBoundaries = (
  state: ManuscriptEditorState,
  position: number
) => {
  let start = position
  let end = position
  const resolvedPos = state.doc.resolve(position)
  const blockStart = resolvedPos.start()
  const blockEnd = resolvedPos.end()

  // Move backward to find the start of the word
  while (
    start > blockStart &&
    !/\s/.test(state.doc.textBetween(start - 1, start))
  ) {
    start--
  }
  // Move forward to find the end of the word
  while (end < blockEnd && !/\s/.test(state.doc.textBetween(end, end + 1))) {
    end++
  }

  let from = start
  let to = end

  // If no word is found (cursor between spaces), search for the previous word
  if (from === to) {
    // Move backward through spaces
    while (
      start > blockStart &&
      /\s/.test(state.doc.textBetween(start - 1, start))
    ) {
      start--
    }
    to = start

    // Move backward to find the start of the previous word
    while (
      start > blockStart &&
      !/\s/.test(state.doc.textBetween(start - 1, start))
    ) {
      start--
    }

    from = start
  }

  return { from, to }
}
