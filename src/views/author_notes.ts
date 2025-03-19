/*!
 * © 2023 Atypon Systems LLC
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

import { AuthorNotesNode, ManuscriptNode } from '@manuscripts/transform'

import { createHeader } from '../lib/utils'
import { Trackable } from '../types'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class AuthorNotesView extends BlockView<Trackable<AuthorNotesNode>> {
  container: HTMLElement
  allowedTypes = ['corresp', 'footnote', 'paragraph']
  correspondenceHeader = 'Correspondence'
  genericHeader = 'Author notes'
  genericHeaderIsDisplayed: boolean

  public ignoreMutation = () => true
  public stopEvent = () => true

  public createElement = () => {
    this.container = document.createElement('div')
    this.container.classList.add('block', 'author-notes-container')
    this.dom.appendChild(this.container)
  }

  public updateContents() {
    super.updateContents()
    this.genericHeaderIsDisplayed = false
    this.dom.setAttribute('contenteditable', 'false')
    this.container.innerHTML = ''

    const items: { [key: string]: ManuscriptNode[] } = {}
    this.allowedTypes.forEach((type) => (items[type] = []))

    // Fill items with nodes of allowed types
    this.node.descendants((node) => {
      if (this.allowedTypes.includes(node.type.name)) {
        items[node.type.name].push(node)
        return false
      }
    })

    this.allowedTypes.forEach((typeName) => {
      if (items[typeName] && items[typeName].length) {
        const content = this.createContent(typeName, items[typeName])
        if (content) {
          this.container.appendChild(content)
        }
      }
    })
  }

  public createContent = (typeName: string, nodes: ManuscriptNode[]) => {
    let isNotEmpty = false
    if (nodes.length) {
      const container = document.createElement('div')
      container.classList.add(`${typeName}s-container`)
      // Show title 'Correspondence' for corresp items
      // or 'Author notes' for other items, but only once
      if (typeName === this.allowedTypes[0]) {
        container.append(createHeader(typeName, this.correspondenceHeader))
      } else if (!this.genericHeaderIsDisplayed) {
        this.genericHeaderIsDisplayed = true
        container.append(createHeader(typeName, this.genericHeader))
      }

      nodes.forEach((node) => {
        if (node.textContent) {
          isNotEmpty = true
          const div = document.createElement('div')
          div.classList.add(typeName)
          div.textContent = node.textContent
          container.append(div)
        }
      })
      return isNotEmpty ? container : null
    }
    return null
  }
}

export default createNodeView(AuthorNotesView)
