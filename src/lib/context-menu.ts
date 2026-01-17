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

import {
  addArrowKeyNavigation,
  makeKeyboardActivatable,
  TriangleCollapsedIcon,
} from '@manuscripts/style-guide'
import {
  isInGraphicalAbstractSection,
  isSectionTitleNode,
  ListNode,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
  Nodes,
  schema,
} from '@manuscripts/transform'
import { Attrs, ResolvedPos } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  addNodeComment,
  createBlock,
  findPosBeforeFirstSubsection,
  insertGeneralTableFootnote,
  insertInlineTableFootnote,
} from '../commands'
import { PopperManager } from './popper'
import { createPositionOptions } from './position-menu'
import { templateAllows } from './template'
import {
  getMatchingChild,
  isChildOfNodeTypes,
  isSelectionInNode,
} from './utils'

const popper = new PopperManager()

const readonlyTypes = [
  schema.nodes.keywords,
  schema.nodes.bibliography_element,
  schema.nodes.bibliography_section,
  schema.nodes.footnotes_section,
]

const isBoxElementSectionTitle = ($pos: ResolvedPos, node: ManuscriptNode) =>
  isSectionTitleNode(node) &&
  $pos.node($pos.depth - 1).type === schema.nodes.box_element

export const sectionLevel = (depth: number) => {
  switch (depth) {
    case 1:
      return 'Section'
    default:
      return 'Sub' + 'sub'.repeat(depth - 2) + 'section'
  }
}

type InsertableNodes = Nodes | 'subsection'

const hasAny = <T>(set: Set<T>, ...items: T[]) => {
  return items.some((i) => set.has(i))
}

export const contextMenuBtnClass = 'btn-context-menu'
const contextSubmenuBtnClass = 'context-submenu-trigger'

export class ContextMenu {
  private readonly node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number

  public constructor(
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos
  }

  public showAddMenu = (target: Element) => {
    const menu = document.createElement('div')
    menu.className = 'menu'
    const $pos = this.resolvePos()
    const insertPos = $pos.after($pos.depth)
    const endPos = $pos.end()
    const types = this.insertableTypes(insertPos, endPos)

    const insertNode = (
      type: ManuscriptNodeType,
      pos?: number,
      attrs?: Attrs
    ) => {
      const { state, dispatch } = this.view

      if (pos === undefined) {
        pos = this.getPos() + this.node.nodeSize
      }

      createBlock(type, pos, state, dispatch, attrs)
    }

    if (hasAny(types, 'section', 'subsection')) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const sectionTitle = $pos.node($pos.depth).child(0).textContent
          const itemTitle = sectionTitle
            ? `“${this.trimTitle(sectionTitle, 30)}”`
            : 'This Section'
          if (
            types.has('section') &&
            !isChildOfNodeTypes(this.view.state.doc, $pos.pos, [
              schema.nodes.abstracts,
              schema.nodes.backmatter,
            ])
          ) {
            const labelPosition = 'After'
            const level = sectionLevel($pos.depth - 1)
            const label = `New ${level} ${labelPosition} ${itemTitle}`

            section.appendChild(
              this.createMenuItem(label, () => {
                insertNode(schema.nodes.section, insertPos)
                popper.destroy()
              })
            )
          }

          if (types.has('subsection')) {
            const insPos = findPosBeforeFirstSubsection($pos) || endPos
            const level = sectionLevel($pos.depth)
            const label = `New ${level} to ${itemTitle}`

            section.appendChild(
              this.createMenuItem(label, () => {
                insertNode(schema.nodes.section, insPos)
                popper.destroy()
              })
            )
          }
        })
      )
    }
    if (hasAny(types, 'paragraph', 'list')) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (types.has('paragraph')) {
            section.appendChild(
              this.createMenuItem('Paragraph', () => {
                insertNode(schema.nodes.paragraph)
                popper.destroy()
              })
            )
          }

          if (types.has('list')) {
            section.appendChild(
              this.createMenuItem('Bulleted List', () => {
                insertNode(schema.nodes.list, undefined, {
                  listStyleType: 'bullet',
                })
                popper.destroy()
              })
            )
            section.appendChild(
              this.createMenuItem('Ordered List', () => {
                insertNode(schema.nodes.list, undefined, {
                  listStyleType: 'order',
                })
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (hasAny(types, 'figure_element', 'equation_element')) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (types.has('figure_element')) {
            section.appendChild(
              this.createMenuItem('Figure Panel', () => {
                insertNode(schema.nodes.figure_element)
                popper.destroy()
              })
            )
          }

          if (types.has('equation_element')) {
            section.appendChild(
              this.createMenuItem('Equation', () => {
                insertNode(schema.nodes.equation_element)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (hasAny(types, 'blockquote_element')) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (types.has('blockquote_element')) {
            section.appendChild(
              this.createMenuItem('Block Quote', () => {
                insertNode(schema.nodes.blockquote_element)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    popper.show(target, menu, 'right', true)

    this.addPopperEventListeners()
  }

  public showEditMenu = (target: Element) => {
    const menu = document.createElement('div')
    menu.className = 'menu'

    const $pos = this.resolvePos()
    const isBox = isBoxElementSectionTitle($pos, this.node)
    const type = isBox ? schema.nodes.box_element : this.node.type

    if (
      type === schema.nodes.figure_element ||
      type === schema.nodes.image_element
    ) {
      const figure = getMatchingChild(
        this.node,
        (node) => node.type === schema.nodes.figure
      )

      if (figure) {
        const attrType = figure.attrs.type
        const submenuOptions = createPositionOptions(
          schema.nodes.figure,
          figure,
          attrType,
          this.view
        )
        const submenuLabel = 'Position'
        const submenu = this.createSubmenu(submenuLabel, submenuOptions)
        menu.appendChild(submenu)
      }
    }

    if (type === schema.nodes.list) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const list = this.node as ListNode
          const type = list.attrs.listStyleType
          if (type === 'simple' || type === 'bullet') {
            section.appendChild(
              this.createMenuItem('Change to Numbered List', () => {
                const tr = this.view.state.tr
                tr.setNodeAttribute(this.getPos(), 'listStyleType', 'order')
                this.view.dispatch(tr)
                popper.destroy()
              })
            )
          } else {
            section.appendChild(
              this.createMenuItem('Change to Bulleted list', () => {
                const tr = this.view.state.tr
                tr.setNodeAttribute(this.getPos(), 'listStyleType', 'bullet')
                this.view.dispatch(tr)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (type === schema.nodes.pullquote_element) {
      const figure = findChildrenByType(this.node, schema.nodes.quote_image)
      if (!figure.length) {
        menu.appendChild(
          this.createMenuItem('Add Image', () => {
            const tr = this.view.state.tr
            tr.insert(this.getPos() + 1, schema.nodes.quote_image.create())
            this.view.dispatch(tr)
            popper.destroy()
          })
        )
      } else {
        const found = figure[0]
        menu.appendChild(
          this.createMenuItem('Remove Image', () => {
            const tr = this.view.state.tr
            tr.delete(
              this.getPos() + 1 + found.pos,
              this.getPos() + 1 + found.pos + found.node.nodeSize
            )
            this.view.dispatch(tr)
            popper.destroy()
          })
        )
      }
    }

    const commentTarget = this.getCommentTarget()
    menu.appendChild(
      this.createMenuSection((section: HTMLElement) => {
        section.appendChild(
          this.createMenuItem('Comment', () => {
            addNodeComment(commentTarget, this.view.state, this.view.dispatch)
            popper.destroy()
          })
        )
      })
    )

    if (type === schema.nodes.table_element) {
      const items: Node[] = []
      const isInsideNode = isSelectionInNode(this.view.state, this.node)
      if (isInsideNode && insertInlineTableFootnote(this.view.state)) {
        const item = this.createMenuItem('Add Reference Note', () => {
          insertInlineTableFootnote(this.view.state, this.view.dispatch)
        })
        items.push(item)
      }
      const pos = this.getPos()
      if (insertGeneralTableFootnote([this.node, pos], this.view.state)) {
        const item = this.createMenuItem('Add General Note', () => {
          insertGeneralTableFootnote(
            [this.node, pos],
            this.view.state,
            this.view.dispatch
          )
        })
        items.push(item)
      }
      if (items.length) {
        menu.append(this.createMenuSection((e) => e.append(...items)))
      }
    }

    if (
      !(
        type === schema.nodes.figure_element &&
        isInGraphicalAbstractSection($pos)
      ) &&
      !readonlyTypes.includes(type) &&
      !readonlyTypes.includes($pos.parent.type)
    ) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          let nodeName = nodeNames.get(type) || ''
          if (type === schema.nodes.section_title) {
            nodeName = nodeNames.get(schema.nodes.section) as string
          }
          section.appendChild(
            this.createMenuItem(`Delete ${nodeName}`, () => {
              this.deleteNode(type)
              popper.destroy()
            })
          )
        })
      )
    }

    if (type === schema.nodes.box_element) {
      const tr = this.view.state.tr
      const boxElementNode = $pos.node($pos.depth - 1)
      const boxStartPos = $pos.start($pos.depth - 1)

      const figcaptions = findChildrenByType(
        boxElementNode,
        schema.nodes.figcaption
      )
      const hasLabel = figcaptions.length > 0

      menu.insertBefore(
        this.createMenuItem(hasLabel ? 'Delete Label' : 'Add Label', () => {
          if (hasLabel) {
            const figcaptionNode = figcaptions[0].node
            const figcaptionPos = boxStartPos + figcaptions[0].pos

            tr.delete(figcaptionPos, figcaptionPos + figcaptionNode.nodeSize)
          } else {
            const newFigcaption = schema.nodes.figcaption.create({}, [
              schema.nodes.caption_title.create(),
            ])

            tr.insert(boxStartPos, newFigcaption)
          }

          this.view.dispatch(tr)
          popper.destroy()
        }),

        menu.firstChild
      )
    }

    popper.show(target, menu, 'right', true)

    this.addPopperEventListeners()
  }

  private createSubmenuTrigger = (contents: string) => {
    const item = document.createElement('div')
    item.className = 'menu-item'
    item.setAttribute('tabindex', '0')
    const textNode = document.createTextNode(contents)
    item.innerHTML = renderToStaticMarkup(createElement(TriangleCollapsedIcon))
    item.prepend(textNode)
    item.classList.add(contextSubmenuBtnClass)

    item.addEventListener('mousedown', this.toggleSubmenu)
    
    // Add keyboard activation for submenu trigger
    makeKeyboardActivatable(item, (event) => {
      this.toggleSubmenu(event as MouseEvent)
    })

    return item
  }

  private createMenuItem = (
    contents: string,
    handler: EventListener,
    IconComponent: React.FC | string | null = null,
    selected = false
  ) => {
    const item = document.createElement('div')
    item.className = 'menu-item'
    selected && item.classList.add('selected')
    if (IconComponent) {
      if (typeof IconComponent === 'string') {
        item.innerHTML = IconComponent
      } else {
        item.innerHTML = renderToStaticMarkup(createElement(IconComponent))
      }
    }
    const textNode = document.createTextNode(contents)
    item.appendChild(textNode)

    item.addEventListener('mousedown', (event) => {
      event.preventDefault()
      handler(event)
    })

    return item
  }

  private createMenuSection = (
    createMenuItems: (section: HTMLElement) => void,
    isSubmenu = false
  ) => {
    const section = document.createElement('div')
    section.className = 'menu-section'
    isSubmenu && section.classList.add('menu')
    createMenuItems(section)
    return section
  }

  private createSubmenu = (
    submenuLabel: string,
    items: {
      title: string
      action: () => void
      IconComponent: React.FC | string | null
      iconName: string
      selected: boolean
    }[]
  ) => {
    const submenu = document.createElement('div')
    submenu.classList.add('context-submenu')
    submenu.append(
      this.createSubmenuTrigger(submenuLabel),
      this.createMenuSection((section: HTMLElement) => {
        items.forEach(({ title, action, IconComponent, selected }) => {
          section.appendChild(
            this.createMenuItem(title, action, IconComponent, selected)
          )
        })
      }, true)
    )

    return submenu
  }

  private insertableTypes = (
    insertPos: number,
    endPos: number
  ): Set<InsertableNodes> => {
    const { nodes } = schema

    const insertable = new Set<InsertableNodes>()

    const doc = this.view.state.doc

    const getPos = (pos?: number) => {
      if (pos === undefined) {
        pos = this.getPos() + this.node.nodeSize
      }
      return pos
    }

    const canInsertAt = (type: ManuscriptNodeType, pos?: number) => {
      const $pos = doc.resolve(getPos(pos))
      const index = $pos.index()
      return $pos.parent.canReplaceWith(index, index, type)
    }

    const checkNode = (node: Nodes, pos?: number) => {
      if (!templateAllows(this.view.state, nodes[node])) {
        return
      }
      canInsertAt(nodes[node], pos) && insertable.add(node)
    }

    if (
      canInsertAt(nodes.section, endPos) &&
      templateAllows(this.view.state, nodes.section)
    ) {
      insertable.add('subsection')
    }
    checkNode('section', insertPos)
    checkNode('paragraph')
    checkNode('list')
    checkNode('figure_element')
    checkNode('table_element')
    checkNode('equation_element')
    checkNode('blockquote_element')
    checkNode('pullquote_element')

    return insertable
  }

  private deleteNode = (nodeType: ManuscriptNodeType) => {
    switch (nodeType.name) {
      case 'section_title': {
        const $pos = this.resolvePos()

        this.view.dispatch(
          this.view.state.tr.delete($pos.before(), $pos.after())
        )

        break
      }

      case 'box_element': {
        const $pos = this.resolvePos()

        this.view.dispatch(
          this.view.state.tr.delete(
            $pos.before($pos.depth - 1),
            $pos.after($pos.depth - 1)
          )
        )

        break
      }

      case 'subtitles': {
        const pos = this.getPos()
        const tr = this.view.state.tr

        tr.delete(pos, pos + this.node.nodeSize)

        // For subtitles, set selection to title end
        const titleNode = findChildrenByType(tr.doc, schema.nodes.title)[0]
        const titleEndPos = titleNode.pos + titleNode.node.nodeSize - 1
        tr.setSelection(TextSelection.create(tr.doc, titleEndPos))

        this.view.dispatch(tr)
        break
      }

      default: {
        const pos = this.getPos()

        this.view.dispatch(
          this.view.state.tr.delete(pos, pos + this.node.nodeSize)
        )

        break
      }
    }
  }

  private resolvePos = () => this.view.state.doc.resolve(this.getPos())

  private addPopperEventListeners = () => {
    const mouseListener: EventListener = (event) => {
      const target = event.target as HTMLElement
      // if target is one of btn-context-menu buttons, do not destroy popper
      if (
        target.classList.contains(contextMenuBtnClass) ||
        target.classList.contains(contextSubmenuBtnClass)
      ) {
        return
      }
      window.requestAnimationFrame(() => {
        window.removeEventListener('mousedown', mouseListener)
        popper.destroy()
      })
    }

    const keyListener: EventListener = (event) => {
      if ((event as KeyboardEvent).key === 'Escape') {
        window.removeEventListener('keydown', keyListener)
        popper.destroy()
      }
    }

    window.addEventListener('mousedown', mouseListener)
    window.addEventListener('keydown', keyListener)

    // Add keyboard navigation for menu items (including submenu triggers)
    const cleanup = addArrowKeyNavigation(document.body, {
      selector: '.menu > .menu-section > .menu-item',
      direction: 'vertical',
      loop: true,
      focusFirstOnMount: true,
      onEscape: () => {
        cleanup()
        popper.destroy()
      },
    })
  }

  private trimTitle = (title: string, max: number) => {
    return title.length > max ? title.substring(0, max) + '…' : title
  }

  private getCommentTarget = () => {
    if (this.node.type === schema.nodes.section_title) {
      const $pos = this.resolvePos()
      const parent = $pos.parent
      if (parent.type === schema.nodes.keywords) {
        const groups = findChildrenByType(parent, schema.nodes.keyword_group)
        return groups.length ? groups[0].node : this.node
      }
      return parent
    }
    return this.node
  }

  private toggleSubmenu = (ev: MouseEvent) => {
    const submenu = (ev.target as HTMLElement).nextElementSibling
    submenu?.classList.toggle('show')
  }
}
