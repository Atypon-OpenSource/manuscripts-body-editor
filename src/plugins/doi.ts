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

import { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export default () => {
  return new Plugin({
    state: {
      init(_, { doc }) {
        const doi = getDOIFromDocument(doc)
        if (doi) {
          const decorations = createDecoration(doc, doi)
          return DecorationSet.create(doc, decorations)
        }
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        if (tr.docChanged) {
          const doi = getDOIFromDocument(newState.doc)
          if (doi) {
            const decorations = createDecoration(newState.doc, doi)
            return DecorationSet.create(newState.doc, decorations)
          }
        }
        return oldDecorationSet
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)
      },
    },
  })
}

function getPosition(doc: Node) {
  const positions: number[] = []
  const possibleNodesTypes = ['keywords', 'supplements', 'abstracts', 'body']
  doc.descendants((node, pos) => {
    if (possibleNodesTypes.includes(node.type.name)) {
      positions.push(pos)
    }
  })
  const position = positions.length === 0 ? 0 : Math.min(...positions)
  return position
}

function getDOIFromDocument(doc: Node): string | null {
  // First check if the current document has a DOI
  if (doc.attrs.doi) {
    return doc.attrs.doi
  }

  // If viewing a snapshot without DOI, try to get DOI from the original document
  // This handles the case where snapshots were created before DOI was set
  // We'll check if there's a stored original document with DOI
  const originalDoc = (
    window as { __originalManuscriptDoc?: { attrs?: { doi?: string } } }
  ).__originalManuscriptDoc
  if (originalDoc && originalDoc.attrs && originalDoc.attrs.doi) {
    return originalDoc.attrs.doi
  }

  return null
}

function createDecoration(doc: Node, doi: string) {
  const decoration = Decoration.widget(getPosition(doc), () => {
    const doiContainer = document.createElement('div')
    doiContainer.classList.add('doi-container', 'block')
    doiContainer.innerHTML = `<p>DOI test2: https://doi.org/${doi}</p>`
    return doiContainer
  })
  return [decoration]
}
