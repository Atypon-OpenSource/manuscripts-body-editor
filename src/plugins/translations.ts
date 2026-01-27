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
import {
  handleEnterKey,
  createKeyboardInteraction,
} from '../lib/navigation-utils'

const createMenuItem = (
  props: EditorProps,
  contents: string,
  handler: EventListener,
  isSelected = false,
  tabIndex: number
) => {
  const item = document.createElement('div')
  item.className = `menu-item ${isSelected ? 'selected' : ''}`
  item.textContent = contents
  item.tabIndex = tabIndex

  item.addEventListener('mousedown', handler)
  item.addEventListener('keydown', handleEnterKey(handler))
  return item
}
interface MenuInstance {
  menu: HTMLElement
  destroy: () => void
}
const createLanguageMenu = (
  props: EditorProps,
  selectedCode: string,
  onSelect: (code: string) => void
): MenuInstance => {
  const menu = document.createElement('div')
  menu.className = 'language menu'
  const menuItems: HTMLElement[] = []

  const removeKeydownListener = createKeyboardInteraction({
    container: document,
    navigation: {
      getItems: () => menuItems,
      arrowKeys: {
        forward: 'ArrowDown',
        backward: 'ArrowUp',
      },
    },
  })
  const destroy = () => {
    removeKeydownListener()
    props.popper.destroy()
  }
  props.languages.forEach((language, index) => {
    const item = createMenuItem(
      props,
      getLanguageLabel(language),
      () => {
        onSelect(language.code)
        destroy()
      },
      selectedCode === language.code,
      index === 0 ? 0 : -1
    )
    menuItems.push(item)
    menu.appendChild(item)
  })

  return { menu, destroy }
}

export default (props: EditorProps) =>
  new Plugin<null>({
    props: {
      decorations: (state) => {
        const can = props.getCapabilities()

        const canEdit = can.editArticle && insertTransAbstract(state)

        const widgets: Decoration[] = []

        state.doc.descendants((node, pos, parent) => {
          if (
            node.type === schema.nodes.section &&
            parent?.type === schema.nodes.abstracts &&
            canEdit
          ) {
            widgets.push(
              Decoration.widget(pos + 1, (view) => {
                const $span = document.createElement('span')
                $span.tabIndex = 0
                $span.className = 'add-trans-abstract'
                $span.title = 'Add translation'
                $span.innerHTML = `${addAuthorIcon} <span class="add-trans-abstract-text">Add translation</span>`

                const handleActivate = (event: Event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  insertTransAbstract(
                    view.state,
                    view.dispatch,
                    node.attrs.category
                  )
                }

                $span.addEventListener('mousedown', handleActivate)
                $span.addEventListener(
                  'keydown',
                  handleEnterKey(handleActivate)
                )
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
                $btn.tabIndex = canEdit ? 0 : -1

                const code = node.attrs.lang || 'en'
                const lang = getLanguage(code, props.languages)
                const label = getLanguageLabel(lang)
                $btn.innerHTML = `<span>${label}</span> ${translateIcon}`

                if (canEdit) {
                  let menuInstance: MenuInstance | null = null
                  const handleOpenMenu = (event: Event) => {
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

                    menuInstance = createLanguageMenu(props, code, handleSelect)

                    props.popper.show(
                      $btn,
                      menuInstance.menu,
                      'bottom-end',
                      false
                    )
                  }

                  createKeyboardInteraction({
                    container: $btn,
                    additionalKeys: {
                      Enter: handleOpenMenu,
                      Escape: (e) => {
                        e.preventDefault()
                        menuInstance?.destroy()
                        menuInstance = null
                      },
                    },
                  })

                  $btn.addEventListener('mousedown', handleOpenMenu)
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
