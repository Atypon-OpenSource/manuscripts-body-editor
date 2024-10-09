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

import { TrackedAttrs } from '@manuscripts/track-changes-plugin'
import { CitationNode, ManuscriptNode } from '@manuscripts/transform'
import CiteProc from 'citeproc'
import { Decoration } from 'prosemirror-view'

import { PluginState } from './index'

export const isBibliographyElement = (node: ManuscriptNode) =>
  node.type === node.type.schema.nodes.bibliography_element

export type CitationNodes = [CitationNode, number][]

export const buildDecorations = (state: PluginState, doc: ManuscriptNode) => {
  const decorations: Decoration[] = []

  let hasMissingItems = false

  for (const [node, pos] of state.citationNodes) {
    const rids = node.attrs.rids
    if (rids.length) {
      for (const rid of rids) {
        if (!state.bibliographyItems.has(rid)) {
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
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        version: state.version,
      })
    )
  }

  if (hasMissingItems) {
    doc.descendants((node, pos) => {
      if (isBibliographyElement(node)) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            missing: 'true',
          })
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

  /**
   * Use decorations to trigger bibliography element update.
   * This is a way to communicate from the plugin to the bibliography element node without actually changing the node.
   * We had to do that due to the absence of an actual node change.
   * @TODO Look for a neater solution (using non-trackable attributes on bibliography_element is a proposed solution)
   */
  doc.descendants((node, pos) => {
    if (isBibliographyElement(node)) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          version: state.version,
        })
      )
    }
  })

  return decorations
}

export const getLatest = (a: TrackedAttrs, b: TrackedAttrs) =>
  a.updatedAt > b.updatedAt ? a : b

export const buildCitations = (citations: CitationNodes): CiteProc.Citation[] =>
  citations
    .map((c) => c[0].attrs)
    .map((attrs) => ({
      citationID: attrs.id,
      citationItems: attrs.rids.map((rid) => ({
        id: rid,
      })),
      properties: {
        noteIndex: 0,
      },
    }))
