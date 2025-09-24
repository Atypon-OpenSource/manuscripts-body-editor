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
        console.log('DOI from doc.attrs:', doc.attrs.doi)
        if (doc.attrs.doi) {
          const decorations = createDecoration(doc)
          return DecorationSet.create(doc, decorations)
        }
        return DecorationSet.empty
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        if (tr.docChanged) {
          console.log('DOI from newState.doc.attrs:', newState.doc.attrs.doi)
          console.log('DOI from oldState.doc.attrs:', oldState.doc.attrs.doi)

          if (newState.doc.attrs.doi) {
            const decorations = createDecoration(newState.doc)
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

function createDecoration(doc: Node) {
  const decoration = Decoration.widget(getPosition(doc), () => {
    const doiContainer = document.createElement('div')
    doiContainer.classList.add('doi-container', 'block')
    doiContainer.innerHTML = `<p>DOI: https://doi.org/${doc.attrs.doi}</p>`
    return doiContainer
  })
  return [decoration]
}
