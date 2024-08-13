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
import { Model, SectionCategory } from '@manuscripts/json-schema'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { sectionCategoryIcon } from '../assets'
import { EditorProps } from '../configs/ManuscriptsEditor'
import { PopperManager } from '../lib/popper'
import {
  getCategoryName,
  isBackMatterSection,
  isEditableSectionCategory,
  isUnique,
} from '../lib/section-categories'
import { isChildOfNodeType } from '../lib/utils'

export const sectionCategoryKey = new PluginKey<PluginState>('section-category')
const popper = new PopperManager()

export interface PluginState {
  decorations: DecorationSet
}

export interface SectionCategoryProps extends EditorProps {
  sectionCategories: SectionCategory[]
}

function changeNodeType(
  view: EditorView,
  node: ManuscriptNode,
  type: string,
  pos: number
) {
  view.dispatch(
    view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      category: type,
    })
  )
}

function createMenuItem(
  contents: string,
  handler: EventListener,
  isDisabled = false,
  isSelected = false
) {
  const item = document.createElement('div')
  item.className = `menu-item ${isDisabled ? 'disabled' : ''} ${
    isSelected ? 'selected' : ''
  }`
  item.textContent = contents
  item.addEventListener('mousedown', (event) => {
    event.preventDefault()
    handler(event)
  })
  return item
}

function createMenu(
  view: EditorView,
  props: SectionCategoryProps,
  node: ManuscriptNode,
  pos: number,
  currCategory: string
) {
  const menu = document.createElement('div')
  menu.className = 'section-category menu'
  const existingCatsCounted = getExistingCatsCounted(view.state)
  const categories = getSortedSectionCategories(
    view.state,
    node,
    props.sectionCategories,
    pos,
    existingCatsCounted
  )
  categories.forEach((category) => {
    const item = createMenuItem(
      category.name,
      () => changeNodeType(view, node, category._id, pos),
      category.isDisabled,
      currCategory === category._id
    )
    menu.appendChild(item)
  })

  document.addEventListener('mousedown', (event) => {
    if (!menu.contains(event.target as Node)) {
      popper.destroy()
    }
  })

  return menu
}

function createButton(
  view: EditorView,
  props: SectionCategoryProps,
  node: ManuscriptNode,
  pos: number,
  category: string,
  canEdit = true
) {
  const arrow = document.createElement('div')
  arrow.className = 'section-category popper-arrow'
  const button = document.createElement('button')
  button.innerHTML = sectionCategoryIcon
  button.className = `section-category-button ${category && 'assigned'}`
  if (canEdit) {
    button.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      popper.destroy()
      const menu = createMenu(view, props, node, pos, category)
      popper.show(button, menu, 'bottom-end', false, [
        { name: 'offset', options: { offset: [0, -10] } },
      ])
    })
  } else {
    button.addEventListener('mouseenter', () => {
      const tooltip = document.createElement('div')
      tooltip.className = 'section-category tooltip'
      tooltip.textContent = 'Category:'
      const span = document.createElement('span')
      span.textContent = getCategoryName(props.sectionCategories, category)
      tooltip.appendChild(span)
      tooltip.appendChild(arrow)
      popper.show(button, tooltip, 'left', false, [
        { name: 'offset', options: { offset: [0, 10] } },
        { name: 'arrow', options: { element: arrow } },
      ])
    })
    button.addEventListener('mouseleave', () => {
      popper.destroy()
    })
  }

  return button
}

function buildPluginState(
  state: EditorState,
  props: SectionCategoryProps
): PluginState {
  const decorations: Decoration[] = []
  const can = props.getCapabilities()

  state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'section' &&
      isEditableSectionCategory(node.attrs.category) &&
      !isUnique(node.attrs.category)
    ) {
      decorations.push(
        Decoration.widget(pos + 1, (view) =>
          createButton(
            view,
            props,
            node,
            pos,
            node.attrs.category,
            can?.editArticle
          )
        )
      )
    }
  })

  return { decorations: DecorationSet.create(state.doc, decorations) }
}

function getExistingCatsCounted(state: EditorState): Record<string, number> {
  const existingCatsCounted: Record<string, number> = {}
  state.doc.descendants((node) => {
    if (
      node.type.name === 'section' &&
      node.attrs.category?.startsWith('MPSectionCategory:')
    ) {
      existingCatsCounted[node.attrs.category] =
        (existingCatsCounted[node.attrs.category] || 0) + 1
    }
  })
  return existingCatsCounted
}

function getSortedSectionCategories(
  state: EditorState,
  container: ManuscriptNode,
  sectionCategories: SectionCategory[],
  pos: number,
  existingCatsCounted: Record<string, number>
): SectionCategory[] {
  let groupIDToUse: string | undefined

  if (container.attrs.category) {
    const sectionCategory = sectionCategories.find(
      ({ _id }) => _id === container.attrs.category
    )
    if (sectionCategory) {
      groupIDToUse = sectionCategory.groupIDs?.[0]
    }
  } else {
    // for newly created sections, that doesn't have category type
    // Check if the node is inside body or backmatter and set the groupID accordingly
    const isChildOfBody = isChildOfNodeType(
      state.doc,
      pos,
      schema.nodes.body.name
    )
    if (isChildOfBody) {
      groupIDToUse = 'MPSectionCategory:body'
    } else {
      groupIDToUse = 'MPSectionCategory:backmatter'
    }
  }
  if (!groupIDToUse) {
    return []
  }

  return sectionCategories
    .filter((category) => category.groupIDs?.includes(groupIDToUse))
    .map((category) => ({
      ...category,
      isDisabled: Boolean(
        existingCatsCounted[category._id] &&
          isBackMatterSection(category.groupIDs?.[0] ?? '')
      ),
    }))
}

export default (props: SectionCategoryProps) =>
  new Plugin<PluginState>({
    key: sectionCategoryKey,
    state: {
      init: (_, state) => buildPluginState(state, props),
      apply: (tr, value, oldState, newState) =>
        buildPluginState(newState, props),
    },
    props: {
      decorations: (state) =>
        sectionCategoryKey.getState(state)?.decorations || DecorationSet.empty,
    },
  })
