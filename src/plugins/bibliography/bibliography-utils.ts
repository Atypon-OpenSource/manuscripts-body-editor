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

import { BibliographyItem } from '@manuscripts/json-schema'
import { CitationNodes } from '@manuscripts/library'
import { ManuscriptNode } from '@manuscripts/transform'
import { Decoration } from 'prosemirror-view'
import { createElement } from 'react'
import ReactDOM from 'react-dom'

import { TrackChangesReview } from '../../components/track-changes/TrackChangesReview'
import { PopperManager } from '../../lib/popper'
import { isPendingSetAttrs } from '../../lib/track-changes-utils'
import { BibliographyProps } from './types'

export const isBibliographyElement = (node: ManuscriptNode) =>
  node.type === node.type.schema.nodes.bibliography_element

/**
 * Since the library collection is only updated _after_ the models have been saved thus
 * the items not always being available, depending on how fast the page renders, as a
 * fallback the bibliography items are also retrieved from the modelsMap.
 */
export const getBibliographyItemFn =
  (props: BibliographyProps) => (id: string) => {
    const libraryItem = props.getLibraryItem(id)
    if (libraryItem) {
      return libraryItem
    }
    return props.getModel<BibliographyItem>(id)
  }

export const buildDecorations = (
  doc: ManuscriptNode,
  citationNodes: CitationNodes,
  getBibliographyItem: (id: string) => BibliographyItem | undefined,
  popper: PopperManager
) => {
  const decorations: Decoration[] = []

  let hasMissingItems = false

  for (const [node, pos, citation] of citationNodes) {
    if (citation.embeddedCitationItems.length) {
      for (const citationItem of citation.embeddedCitationItems) {
        if (!getBibliographyItem(citationItem.bibliographyItem)) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: 'citation-missing',
            })
          )

          hasMissingItems = true
        }
      }
    } else {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'citation-empty',
        })
      )
    }
    if (isPendingSetAttrs(node)) {
      decorations.push(
        Decoration.widget(
          pos + node.nodeSize,
          () => {
            const el = document.createElement('span')
            el.classList.add('track-changes-review')
            ReactDOM.render(
              createElement(TrackChangesReview, {
                node,
                popper,
                target: el,
              }),
              el
            )
            return el
          },
          { side: -1 }
        )
      )
    }
  }

  if (hasMissingItems) {
    doc.descendants((node, pos) => {
      if (isBibliographyElement(node)) {
        decorations.push(
          Decoration.node(
            pos,
            pos + node.nodeSize,
            {},
            {
              missing: true,
            }
          )
        )

        decorations.push(
          Decoration.widget(pos, () => {
            const el = document.createElement('div')
            el.className = 'bibliography-missing'
            el.textContent = `The bibliography could not be generated, due to a missing library item.`
            return el
          })
        )
      }
    })
  }

  return decorations
}
