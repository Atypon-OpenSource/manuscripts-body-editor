/*!
 * © 2024 Atypon Systems LLC
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

import { Node as ProseMirrorNode } from 'prosemirror-model'

import { isDeleted, isDeletedText } from '../../lib/track-changes-utils'

export function getNewMatch(
  side: 'left' | 'right',
  current: number,
  selection: { from: number; to: number },
  matches: { from: number; to: number }[]
) {
  if (current < 0) {
    // it means we need to recalc againt the new pointer
    return getClosestMatch(side, selection, matches)
  }

  let newMatch = 0
  if (side == 'left') {
    newMatch = current - 1 >= 0 ? current - 1 : matches.length - 1
  }
  if (side == 'right') {
    newMatch = current + 1 < matches.length ? current + 1 : 0
  }
  return newMatch
}

export function getClosestMatch(
  side: 'left' | 'right',
  selection: { from: number; to: number },
  matches: { from: number; to: number }[]
) {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    if (match.from >= selection.from) {
      return side == 'right' ? i : Math.max(0, i - 1)
    }
  }
  return 0
}

function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function getMatches(
  doc: ProseMirrorNode,
  value: string,
  caseSensitive: boolean,
  ignoreDiacritics: boolean
) {
  if (!value) {
    return []
  }
  let normalised = caseSensitive ? value : value.toLocaleLowerCase()
  if (ignoreDiacritics) {
    normalised = removeDiacritics(normalised)
  }
  const matches: Array<{ from: number; to: number }> = []

  doc.descendants((node, pos) => {
    if (isDeleted(node) || isDeletedText(node)) {
      return
    }
    if (node.isText && node.text) {
      let base = caseSensitive ? node.text : node.text.toLocaleLowerCase()
      if (ignoreDiacritics) {
        base = removeDiacritics(base)
      }
      let index = base.indexOf(normalised)
      while (index !== -1) {
        matches.push({
          from: pos + index,
          to: pos + index + normalised.length,
        })
        index = base.indexOf(normalised, index + normalised.length)
      }
    }
  })

  return matches
}
