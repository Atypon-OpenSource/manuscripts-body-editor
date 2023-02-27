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

import { CommentAnnotation } from '@manuscripts/json-schema'
import {
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
} from '@manuscripts/transform'
import { Fragment, Slice } from 'prosemirror-model'

import { addComment, createBlock } from '../commands'
import { PopperManager } from './popper'

const popper = new PopperManager()

export const sectionLevel = (depth: number) => {
  switch (depth) {
    case 1:
      return 'Section'
    default:
      return 'Sub' + 'sub'.repeat(depth - 2) + 'section'
  }
}

interface Actions {
  setComment?: (comment?: CommentAnnotation) => void
}

interface SuppressOption {
  attr: string
  attrs: { [key: string]: boolean }
  getPos: () => number
  label: string
}

export class ContextMenu {
  private readonly node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number
  private readonly actions: Actions

  private suppressibleAttrs: Map<string, string> = new Map([
    ['suppressCaption', 'Caption'],
    ['suppressHeader', 'Header'],
    ['suppressFooter', 'Footer'],
  ])

  public constructor(
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number,
    actions: Actions = {}
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.actions = actions
  }

  public showAddMenu = (target: Element, after: boolean) => {
    const menu = document.createElement('div')
    menu.className = 'menu'

    const $pos = this.resolvePos()
    const insertPos = after ? $pos.after($pos.depth) : $pos.before($pos.depth)
    const endPos = $pos.end()

    const insertableTypes = this.insertableTypes(after, insertPos, endPos)

    const { nodes } = this.view.state.schema

    if (this.showMenuSection(insertableTypes, ['section', 'subsection'])) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const labelPosition = after ? 'After' : 'Before'
          const sectionTitle = $pos.node($pos.depth).child(0).textContent
          const itemTitle = sectionTitle
            ? `“${this.trimTitle(sectionTitle, 30)}”`
            : 'This Section'
          const itemLabel = `New ${sectionLevel(
            $pos.depth
          )} ${labelPosition} ${itemTitle}`

          if (insertableTypes.section) {
            section.appendChild(
              this.createMenuItem(itemLabel, () => {
                this.addBlock(nodes.section, after, insertPos)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.subsection) {
            const subItemLabel = `New ${sectionLevel(
              $pos.depth + 1
            )} to ${itemTitle}`

            section.appendChild(
              this.createMenuItem(subItemLabel, () => {
                this.addBlock(nodes.section, after, endPos)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (
      this.showMenuSection(insertableTypes, [
        'paragraph',
        'orderedList',
        'bulletList',
      ])
    ) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (insertableTypes.paragraphElement) {
            section.appendChild(
              this.createMenuItem('Paragraph', () => {
                this.addBlock(nodes.paragraph, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.orderedList) {
            section.appendChild(
              this.createMenuItem('Numbered List', () => {
                this.addBlock(nodes.ordered_list, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.bulletList) {
            section.appendChild(
              this.createMenuItem('Bullet List', () => {
                this.addBlock(nodes.bullet_list, after)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (
      this.showMenuSection(insertableTypes, [
        'figure',
        'tableElement',
        'equationElement',
        'listingElement',
      ])
    ) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (insertableTypes.figureElement) {
            section.appendChild(
              this.createMenuItem('Figure Panel', () => {
                this.addBlock(nodes.figure_element, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.tableElement) {
            section.appendChild(
              this.createMenuItem('Table', () => {
                this.addBlock(nodes.table_element, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.equationElement) {
            section.appendChild(
              this.createMenuItem('Equation', () => {
                this.addBlock(nodes.equation_element, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.listingElement) {
            section.appendChild(
              this.createMenuItem('Listing', () => {
                this.addBlock(nodes.listing_element, after)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (
      this.showMenuSection(insertableTypes, [
        'blockquoteElement',
        'pullquoteElement',
      ])
    ) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (insertableTypes.blockquoteElement) {
            section.appendChild(
              this.createMenuItem('Block Quote', () => {
                this.addBlock(nodes.blockquote_element, after)
                popper.destroy()
              })
            )
          }

          if (insertableTypes.pullquoteElement) {
            section.appendChild(
              this.createMenuItem('Pull Quote', () => {
                this.addBlock(nodes.pullquote_element, after)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    popper.show(target, menu, 'right', true, {
      modifiers: {
        offset: { offset: '0, 50%p' },
      },
    })

    this.addPopperEventListeners()
  }

  public showEditMenu = (target: Element) => {
    const menu = document.createElement('div')
    menu.className = 'menu'

    const $pos = this.resolvePos()
    const nodeType = this.node.type

    const { nodes } = this.view.state.schema

    if (this.isListType(nodeType.name)) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (nodeType === nodes.bullet_list) {
            section.appendChild(
              this.createMenuItem('Change to Numbered List', () => {
                this.changeNodeType(nodes.ordered_list)
                popper.destroy()
              })
            )
          }

          if (nodeType === nodes.ordered_list) {
            section.appendChild(
              this.createMenuItem('Change to Bullet List', () => {
                this.changeNodeType(nodes.bullet_list)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    const { setComment } = this.actions

    if (setComment) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          section.appendChild(
            this.createMenuItem('Comment', () => {
              const { state, dispatch } = this.view
              addComment(state, dispatch, this.node, this.resolvePos())
              popper.destroy()
            })
          )
        })
      )
    }

    const suppressOptions = this.buildSuppressOptions()

    if (suppressOptions.length) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          for (const option of suppressOptions) {
            // TODO: parent node attrs
            const label = option.attrs[option.attr]
              ? `Show ${option.label}`
              : `Hide ${option.label}`

            section.appendChild(
              this.createMenuItem(label, () => {
                this.toggleNodeAttr(option)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (nodeType === nodes.paragraph && $pos.parent.type === nodes.section) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          section.appendChild(
            this.createMenuItem(
              `Split to New ${sectionLevel($pos.depth)}`,
              () => {
                this.splitSection()
                popper.destroy()
              }
            )
          )
        })
      )
    }

    if (nodeType !== nodes.bibliography_element) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const nodeName = nodeNames.get(nodeType) || ''

          section.appendChild(
            this.createMenuItem(`Delete ${nodeName}`, () => {
              this.deleteNode(nodeType)
              popper.destroy()
            })
          )
        })
      )
    }

    popper.show(target, menu, 'right', true, {
      modifiers: {
        offset: { offset: '0, 50%p' },
      },
    })

    this.addPopperEventListeners()
  }

  private addBlock = (
    nodeType: ManuscriptNodeType,
    after: boolean,
    position?: number
  ) => {
    const { state, dispatch } = this.view

    if (position === undefined) {
      position = after ? this.getPos() + this.node.nodeSize : this.getPos()
    }

    createBlock(nodeType, position, state, dispatch)
  }

  private canAddBlock = (
    nodeType: ManuscriptNodeType,
    after: boolean,
    position?: number
  ) => {
    const {
      state: { doc },
    } = this.view

    if (position === undefined) {
      position = after ? this.getPos() + this.node.nodeSize : this.getPos()
    }

    const $position = doc.resolve(position)

    const index = $position.index()

    return $position.parent.canReplaceWith(index, index, nodeType)
  }

  private createMenuItem = (contents: string, handler: EventListener) => {
    const item = document.createElement('div')
    item.className = 'menu-item'
    item.textContent = contents
    item.addEventListener('mousedown', (event) => {
      event.preventDefault()
      handler(event)
    })
    return item
  }

  private createMenuSection = (
    createMenuItems: (section: HTMLElement) => void
  ) => {
    const section = document.createElement('div')
    section.className = 'menu-section'
    createMenuItems(section)
    return section
  }

  private insertableTypes = (
    after: boolean,
    insertPos: number,
    endPos: number
  ) => {
    const { nodes } = this.view.state.schema

    return {
      section: this.canAddBlock(nodes.section, after, insertPos),
      subsection: this.canAddBlock(nodes.section, after, endPos),
      paragraphElement: this.canAddBlock(nodes.paragraph, after),
      orderedList: this.canAddBlock(nodes.ordered_list, after),
      bulletList: this.canAddBlock(nodes.bullet_list, after),
      figureElement: this.canAddBlock(nodes.figure_element, after),
      tableElement: this.canAddBlock(nodes.table_element, after),
      equationElement: this.canAddBlock(nodes.equation_element, after),
      listingElement: this.canAddBlock(nodes.listing_element, after),
      blockquoteElement: this.canAddBlock(nodes.blockquote_element, after),
      pullquoteElement: this.canAddBlock(nodes.pullquote_element, after),
    }
  }

  private showMenuSection = (
    insertableTypes: { [key: string]: boolean },
    types: string[]
  ) => types.some((type) => insertableTypes[type])

  private changeNodeType = (nodeType: ManuscriptNodeType) => {
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(this.getPos(), nodeType, {
        id: this.node.attrs.id,
      })
    )

    popper.destroy()
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

      case 'bibliography_element': {
        const $pos = this.resolvePos()

        this.view.dispatch(
          this.view.state.tr.delete(
            $pos.before($pos.depth),
            $pos.after($pos.depth)
          )
        )

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

  private splitSection = () => {
    const { schema, tr } = this.view.state

    const from = this.getPos()
    const to = from + this.node.nodeSize

    const slice = new Slice(
      Fragment.from([
        schema.nodes.section.create(),
        schema.nodes.section.create({}, [
          schema.nodes.section_title.create(),
          this.node,
        ]),
      ]),
      1,
      1
    )

    this.view.dispatch(tr.replaceRange(from, to, slice))
  }

  private toggleNodeAttr = (option: SuppressOption) => {
    const { getPos, attr, attrs } = option

    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(getPos(), undefined, {
        ...attrs,
        [attr]: !attrs[attr],
      })
    )
  }

  private isListType = (type: string) =>
    ['bullet_list', 'ordered_list'].includes(type)

  private buildSuppressOptions = () => {
    const items: SuppressOption[] = []

    let attrs = this.node.attrs
    // TODO:: this is just a hacky workaround, we should remove it when add suppressTitle to manuscripts-examples
    if (this.node.attrs.suppressTitle === undefined) {
      attrs = Object.assign(this.node.attrs, { suppressTitle: true })
    }

    for (const [attr, label] of this.suppressibleAttrs.entries()) {
      if (attr in attrs) {
        items.push({
          attr,
          attrs,
          label,
          getPos: this.getPos,
        })
      }
    }

    return items
  }

  private addPopperEventListeners = () => {
    const mouseListener: EventListener = () => {
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
  }

  private trimTitle = (title: string, max: number) => {
    return title.length > max ? title.substr(0, max) + '…' : title
  }
}
