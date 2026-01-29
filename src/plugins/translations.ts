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

import { schema } from '@manuscripts/transform'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { insertTransAbstract } from '../commands'
import { EditorProps } from '../configs/ManuscriptsEditor'
import { addAuthorIcon, translateIcon } from '../icons'
import { getLanguage, getLanguageLabel } from '../lib/languages'
import { templateAllows } from '../lib/template'

const createMenuItem = (
  props: EditorProps,
  contents: string,
  handler: EventListener,
  isSelected = false
) => {
  const item = document.createElement('div')
  item.className = `menu-item ${isSelected ? 'selected' : ''}`
  item.textContent = contents
  item.addEventListener('mousedown', (event) => {
    handler(event)
    props.popper.destroy()
  })
  return item
}

const createLanguageMenu = (
  props: EditorProps,
  selectedCode: string,
  onSelect: (code: string) => void
) => {
  const menu = document.createElement('div')
  menu.className = 'language menu'
  props.languages.forEach((language) => {
    const item = createMenuItem(
      props,
      getLanguageLabel(language),
      () => onSelect(language.code),
      selectedCode === language.code
    )
    menu.appendChild(item)
  })
  return menu
}

export default (props: EditorProps) =>
  new Plugin<null>({
    props: {
      decorations: (state) => {
        const can = props.getCapabilities()
        const canEdit =
          can.editArticle &&
          templateAllows(state, schema.nodes.trans_abstract) &&
          insertTransAbstract(state)

        const widgets: Decoration[] = []

        state.doc.descendants((node, pos, parent) => {
          const isAbstractSection =
            (node.type === schema.nodes.section ||
              node.type === schema.nodes.graphical_abstract_section) &&
            parent?.type === schema.nodes.abstracts

          if (isAbstractSection && canEdit) {
            widgets.push(
              Decoration.widget(pos + 1, (view) => {
                const $span = document.createElement('span')
                $span.className = 'add-trans-abstract'
                $span.title = 'Add translation'
                $span.innerHTML = `${addAuthorIcon} <span class="add-trans-abstract-text">Add translation</span>`

                $span.addEventListener('mousedown', (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  insertTransAbstract(
                    view.state,
                    view.dispatch,
                    node.attrs.category,
                    pos + node.nodeSize
                  )
                })
                return $span
              })
            )
          }

          if (node.type === schema.nodes.trans_abstract) {
            widgets.push(
              Decoration.widget(pos + 1, (view) => {
                const $btn = document.createElement('span')
                $btn.className = 'language-selector-btn'
                $btn.setAttribute('data-cy', 'language-selector-btn')
                $btn.contentEditable = 'false'

                const code = node.attrs.lang || 'en'
                const lang = getLanguage(code, props.languages)
                const label = getLanguageLabel(lang)
                $btn.innerHTML = `<span>${label}</span> ${translateIcon}`

                if (canEdit) {
                  $btn.addEventListener('mousedown', (event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    props.popper.destroy() // Ensure any existing popper is closed

                    const handleSelect = (code: string) => {
                      const tr = view.state.tr.setNodeAttribute(
                        pos,
                        'lang',
                        code
                      )
                      view.dispatch(tr)
                    }

                    const menu = createLanguageMenu(props, code, handleSelect)

                    props.popper.show($btn, menu, 'bottom-end', false)
                  })
                }

                return $btn
              })
            )
          }
        })

        return DecorationSet.create(state.doc, widgets)
      },
    },
  })
