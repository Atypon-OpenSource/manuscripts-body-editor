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

import { ManuscriptNode, schema } from '@manuscripts/transform'
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

export const renderMath = async (math: string, format: string) => {
  if (format === 'tex') {
    const { convertTeXToSVG } = await import('../lib/tex-to-svg')
    return convertTeXToSVG(math)
  } else {
    const { convertMathMLToSVG } = await import('../lib/mathml-to-svg')
    return convertMathMLToSVG(math)
  }
}

export const handleScrollToBibliographyItem = (view: EditorView) => {
  const tr = view.state.tr

  const node = tr.doc.nodeAt(tr.selection.$from.pos)

  if (!node || node.type !== schema.nodes.bibliography_item) {
    return false
  }

  const bibliographyItemElement = document.querySelector(
    `[id="${node.attrs.id}"]`
  ) as HTMLElement

  if (!bibliographyItemElement) {
    return false
  }
  const bibliographyItemRect = bibliographyItemElement.getBoundingClientRect()
  const editorBodyElement = document.querySelector(
    '.editor-body'
  ) as HTMLElement
  const parentRect = editorBodyElement.getBoundingClientRect()

  if (
    bibliographyItemRect.bottom > window.innerHeight ||
    bibliographyItemRect.top < 150
  ) {
    let childTopOffset = bibliographyItemRect.top - parentRect.top
    // to center the element vertically within the viewport.
    childTopOffset =
      childTopOffset - (window.innerHeight - bibliographyItemRect.height) / 2

    const scrollToTop = editorBodyElement.scrollTop + childTopOffset
    editorBodyElement.scrollTo({ top: scrollToTop, behavior: 'smooth' })
  }

  return true
}
