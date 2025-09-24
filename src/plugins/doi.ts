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
  console.log('🔧 DOI Plugin: Initializing plugin')
  return new Plugin({
    state: {
      init(_, { doc }) {
        console.log('🔧 DOI Plugin: init() called')
        console.log('🔧 DOI Plugin: doc.attrs =', doc.attrs)
        const doi = getDOIFromDocument(doc)
        console.log('🔧 DOI Plugin: Retrieved DOI =', doi)
        if (doi) {
          const decorations = createDecoration(doc, doi)
          console.log('🔧 DOI Plugin: Created decorations =', decorations)
          return DecorationSet.create(doc, decorations)
        }
        console.log(
          '🔧 DOI Plugin: No DOI found, returning empty decoration set'
        )
        return DecorationSet.empty
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        console.log(
          '🔧 DOI Plugin: apply() called, docChanged =',
          tr.docChanged
        )
        if (tr.docChanged) {
          console.log('🔧 DOI Plugin: Document changed, checking for DOI')
          const doi = getDOIFromDocument(newState.doc)
          console.log('🔧 DOI Plugin: Retrieved DOI =', doi)
          if (doi) {
            const decorations = createDecoration(newState.doc, doi)
            console.log('🔧 DOI Plugin: Created decorations =', decorations)
            return DecorationSet.create(newState.doc, decorations)
          }
        }
        console.log('🔧 DOI Plugin: Returning old decoration set')
        return oldDecorationSet
      },
    },
    props: {
      decorations(state) {
        const decorations = this.getState(state)
        console.log(
          '🔧 DOI Plugin: decorations() called, returning =',
          decorations
        )
        return decorations
      },
    },
  })
}

function getPosition(doc: Node) {
  console.log('🔧 DOI Plugin: getPosition() called')
  const positions: number[] = []
  const possibleNodesTypes = ['keywords', 'supplements', 'abstracts', 'body']
  console.log('🔧 DOI Plugin: Looking for node types =', possibleNodesTypes)

  doc.descendants((node, pos) => {
    console.log(
      '🔧 DOI Plugin: Checking node =',
      node.type.name,
      'at position =',
      pos
    )
    if (possibleNodesTypes.includes(node.type.name)) {
      console.log(
        '🔧 DOI Plugin: Found matching node type =',
        node.type.name,
        'at position =',
        pos
      )
      positions.push(pos)
    }
  })

  const position = positions.length === 0 ? 0 : Math.min(...positions)
  console.log(
    '🔧 DOI Plugin: Found positions =',
    positions,
    'final position =',
    position
  )
  return position
}

function getDOIFromDocument(doc: Node): string | null {
  console.log('🔧 DOI Plugin: getDOIFromDocument() called')
  console.log('🔧 DOI Plugin: doc.attrs =', doc.attrs)

  // First check if the current document has a DOI
  if (doc.attrs.doi) {
    console.log('🔧 DOI Plugin: Found DOI in current document =', doc.attrs.doi)
    return doc.attrs.doi
  }

  // If viewing a snapshot without DOI, try to get DOI from the original document
  // This handles the case where snapshots were created before DOI was set
  // We'll check if there's a stored original document with DOI
  const originalDoc = (
    window as { __originalManuscriptDoc?: { attrs?: { doi?: string } } }
  ).__originalManuscriptDoc
  console.log('🔧 DOI Plugin: window.__originalManuscriptDoc =', originalDoc)

  if (originalDoc && originalDoc.attrs && originalDoc.attrs.doi) {
    console.log(
      '🔧 DOI Plugin: Found DOI in original document =',
      originalDoc.attrs.doi
    )
    return originalDoc.attrs.doi
  }

  console.log('🔧 DOI Plugin: No DOI found in current or original document')
  return null
}

function createDecoration(doc: Node, doi: string) {
  console.log('🔧 DOI Plugin: createDecoration() called with DOI =', doi)
  const position = getPosition(doc)
  console.log('🔧 DOI Plugin: Calculated position =', position)

  const decoration = Decoration.widget(position, () => {
    console.log('🔧 DOI Plugin: Creating DOI widget element')
    const doiContainer = document.createElement('div')
    doiContainer.classList.add('doi-container', 'block')
    doiContainer.innerHTML = `<p>DOI test2: https://doi.org/${doi}</p>`
    console.log('🔧 DOI Plugin: Created DOI container element =', doiContainer)
    return doiContainer
  })
  console.log('🔧 DOI Plugin: Created decoration =', decoration)
  return [decoration]
}
