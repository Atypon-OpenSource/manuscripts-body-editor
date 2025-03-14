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
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

// altTitlesButton: HTMLElement

//   createOrOpenAltTitles() {
//     let runningTitle: AltTitleNode | undefined
//     let shortTitle: AltTitleNode | undefined
//     const tr = this.view.state.tr

//     const schema = this.view.state.schema

//     this.node.descendants((node) => {
//       if (node.type === schema.nodes.alt_title) {
//         if (node.attrs.type === 'running') {
//           runningTitle = node as AltTitleNode
//         }
//         if (node.attrs.type === 'short') {
//           shortTitle = node as AltTitleNode
//         }
//       }
//     })

//     if (!runningTitle) {
//       const title = schema.nodes.alt_title.create({
//         type: 'running',
//       })
//       tr.insert(this.getPos() + this.node.nodeSize - 1, title)
//     }

//     if (!shortTitle) {
//       const title = schema.nodes.alt_title.create({ type: 'short' })
//       const newPos = tr.mapping.map(this.getPos() + this.node.nodeSize)
//       tr.insert(newPos - 1, title)
//     }

//     this.dom.classList.add('all-titles-visible')
//     this.props.dispatch && this.props.dispatch(skipTracking(tr))
//   }

//   createAltTitlesButton() {
//     if (!this.altTitlesButton) {
//       this.altTitlesButton = document.createElement('button')
//       this.altTitlesButton.classList.add('open-alt-titles')
//       this.altTitlesButton.innerHTML = 'T'
//       this.altTitlesButton.addEventListener('click', (e) => {
//         e.preventDefault()
//         this.createOrOpenAltTitles()
//       })
//       this.dom.appendChild(this.altTitlesButton)
//     }
//   }

export interface PluginState {
  collapsed: boolean
}

export const altTitlesKey = new PluginKey<PluginState>('altTitles')

export default () => {
  return new Plugin<PluginState>({
    key: altTitlesKey,
    state: {
      init: (_, state) => {
        return { collapsed: false }
      },
      apply: (tr, value) => {
        if (tr.getMeta(altTitlesKey)) {
          return tr.getMeta(altTitlesKey)
        }
        return value
      },
    },
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []
        state.doc.descendants((node, pos) => {
          if (node.type === state.schema.nodes.alt_title) {
            decorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: 'alt-title-wrapper',
              })
            )
          }
        })
        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
