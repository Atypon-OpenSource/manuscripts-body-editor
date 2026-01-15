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
import {
  getGroupCategories,
  isSectionNode,
  schema,
  SectionCategory,
} from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import {
  findChildrenByType,
  findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { sectionCategoryIcon } from '../icons'

export const sectionCategoryKey = new PluginKey<PluginState>('section-category')

export interface PluginState {
  decorations: DecorationSet
}

export default (props: EditorProps) =>
  new Plugin<PluginState>({
    key: sectionCategoryKey,
    state: {
      init: (_, state) => buildPluginState(state, props),
      apply: (tr, value, oldState, newState) => {
        if (!tr.docChanged) {
          return value
        }
        return buildPluginState(newState, props)
      },
    },
    props: {
      decorations: (state) =>
        sectionCategoryKey.getState(state)?.decorations || DecorationSet.empty,
    },
  })

const createMenuItem = (
  props: EditorProps,
  contents: string,
  handler: EventListener,
  isDisabled: boolean,
  isSelected: boolean
) => {
  const item = document.createElement('div')
  item.classList.add('menu-item')
  if (isSelected) {
    item.classList.add('selected')
  }
  if (isDisabled) {
    item.classList.add('disabled')
  }
  item.textContent = contents
  item.setAttribute('tabindex', '0')
  item.addEventListener('mousedown', (event) => {
    handler(event)
    props.popper.destroy()
  })
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handler(event)
      props.popper.destroy()
    }
  })
  return item
}

const createMenu = (
  props: EditorProps,
  currentCategory: SectionCategory | undefined,
  categories: SectionCategory[],
  usedCategoryIDs: Set<string>,
  onSelect: (category: SectionCategory) => void
) => {
  const menu = document.createElement('div')
  menu.className = 'section-category menu'
  const menuItems: HTMLElement[] = []

  categories.forEach((category) => {
    const item = createMenuItem(
      props,
      category.titles[0],
      () => onSelect(category),
      category.isUnique && usedCategoryIDs.has(category.id),
      currentCategory === category
    )
    menuItems.push(item)
    menu.appendChild(item)
  })

  // Arrow key navigation for menu items
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (menuItems.length === 0) {
        return
      }
      const currentIndex = menuItems.findIndex(
        (item) => item === document.activeElement
      )
      if (currentIndex === -1) {
        menuItems[0]?.focus()
        return
      }
      const nextIndex =
        event.key === 'ArrowDown'
          ? (currentIndex + 1) % menuItems.length
          : (currentIndex - 1 + menuItems.length) % menuItems.length
      menuItems[nextIndex]?.focus()
    }
  }
  document.addEventListener('keydown', handleKeydown)

  // Focus the first menu item when menu opens
  window.requestAnimationFrame(() => {
    menuItems[0]?.focus()
  })

  return menu
}

const createButton = (
  props: EditorProps,
  view: EditorView,
  pos: number,
  currentCategory: SectionCategory | undefined,
  categories: SectionCategory[],
  usedCategoryIDs: Set<string>,
  canEdit = true,
  disabled: boolean
) => {
  const handleSelect = (category: SectionCategory) => {
    const tr = view.state.tr
    tr.setNodeAttribute(pos, 'category', category.id)
    view.dispatch(tr)
  }
  const openMenu = () => {
    const menu = createMenu(
      props,
      currentCategory,
      categories,
      usedCategoryIDs,
      handleSelect
    )

    props.popper.show(button, menu, 'bottom-end', false)
  }
  const button = document.createElement('button')
  button.innerHTML = sectionCategoryIcon
  button.classList.add('section-category-button')
  button.setAttribute('aria-label', 'Section categories menu')
  if (currentCategory) {
    button.setAttribute('data-tooltip-content', currentCategory.titles[0])
    button.classList.add('assigned')
  }
  if (disabled) {
    button.classList.add('disabled')
  } else if (canEdit) {
    button.addEventListener('click', openMenu)
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        openMenu()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        props.popper.destroy()
      }
    })
  }

  return button
}

const buildPluginState = (
  state: EditorState,
  props: EditorProps
): PluginState => {
  const decorations: Decoration[] = []
  const can = props.getCapabilities()
  const categories = props.sectionCategories
  const usedCategoryIDs = getUsedSectionCategoryIDs(state)
  const canEdit = !!can?.editArticle

  state.doc.descendants((node, pos) => {
    if (node.type === schema.nodes.box_element) {
      return false
    }
    if (node.type === schema.nodes.section_title) {
      const $pos = state.doc.resolve(pos)
      const parentSection = $pos.parent

      if (isSectionNode(parentSection)) {
        const categoryID = parentSection.attrs.category
        const category = categories.get(categoryID)
        const group = getGroup($pos)
        const groupCategories = getGroupCategories(categories, group)
        const numOptions = groupCategories.length

        const shouldShow = !!category || (canEdit && numOptions >= 2)

        if (shouldShow) {
          const isEditable = canEdit && numOptions >= 2

          decorations.push(
            Decoration.widget(pos + 1, (view) =>
              createButton(
                props,
                view,
                pos,
                category,
                groupCategories,
                usedCategoryIDs,
                isEditable,
                categories.size === 0
              )
            )
          )
        }
        return false
      }
    }
  })

  return { decorations: DecorationSet.create(state.doc, decorations) }
}

const getUsedSectionCategoryIDs = (state: EditorState): Set<string> => {
  const sections = findChildrenByType(state.doc, schema.nodes.section)
  const used = new Set<string>()
  sections.forEach(({ node }) => {
    if (node.attrs.category) {
      used.add(node.attrs.category)
    }
  })
  return used
}

const getGroup = ($pos: ResolvedPos) => {
  if (findParentNodeOfTypeClosestToPos($pos, schema.nodes.abstracts)) {
    return 'abstracts'
  }
  if (findParentNodeOfTypeClosestToPos($pos, schema.nodes.backmatter)) {
    return 'backmatter'
  }
  return 'body'
}
