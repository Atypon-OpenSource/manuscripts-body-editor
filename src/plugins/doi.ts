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
import { schema } from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export default () => {
  return new Plugin({
    state: {
      init(_, { doc }) {
        const decorations = createDecoration(doc)
        return DecorationSet.create(doc, decorations)
      },
      apply(tr, oldDecorationSet, oldState, newState) {
        if (tr.docChanged) {
          const decorations = createDecoration(newState.doc)
          return DecorationSet.create(newState.doc, decorations)
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
  let position = 0
  const possibleNodesTypes = ['keywords', 'supplements', 'abstracts', 'body']
  for (const type of possibleNodesTypes) {
    doc.descendants((node, pos) => {
      if (node.type === schema.nodes[type]) {
        position = pos
      }
    })
    if (position != 0) {
      break
    }
  }
  return position
}

function createDecoration(doc: Node) {
  const decoration = Decoration.widget(getPosition(doc), () => {
    const doiContainer = document.createElement('div')
    doiContainer.classList.add('doi-container', 'block')
    if (doc.attrs.doi) {
      doiContainer.innerHTML = `<p>DOI: https://doi.org: ${doc.attrs.doi}</p>`
    }
    return doiContainer
  })
  return [decoration]
}
