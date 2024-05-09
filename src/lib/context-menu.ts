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
  FootnoteWithIndex,
  TableFootnotesSelector,
} from '@manuscripts/style-guide'
import {
  InlineFootnoteNode,
  isInBibliographySection,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
  Nodes,
  schema,
} from '@manuscripts/transform'
import { NodeType, ResolvedPos } from 'prosemirror-model'
import { findChildrenByType, hasParentNodeOfType } from 'prosemirror-utils'

import {
  addComment,
  createBlock,
  insertGeneralFootnote,
  insertTableFootnote,
} from '../commands'
import { buildTableFootnoteLabels } from '../plugins/footnotes/footnotes-utils'
import { EditableBlockProps } from '../views/editable_block'
import ReactSubView from '../views/ReactSubView'
import { PopperManager } from './popper'
import { isDeleted, isRejectedInsert } from './track-changes-utils'

const popper = new PopperManager()

const listTypes = [schema.nodes.ordered_list, schema.nodes.bullet_list]

const readonlyTypes = [schema.nodes.keywords, schema.nodes.bibliography_element]

const isGraphicalAbstractFigure = ($pos: ResolvedPos, type: NodeType) =>
  type === schema.nodes.figure &&
  $pos.parent.type === schema.nodes.graphical_abstract_section

export const sectionLevel = (depth: number) => {
  switch (depth) {
    case 1:
      return 'Section'
    default:
      return 'Sub' + 'sub'.repeat(depth - 2) + 'section'
  }
}

interface Actions {
  setComment?: (comment: CommentAnnotation) => void
}

type InsertableNodes = Nodes | 'subsection'

const hasAny = <T>(set: Set<T>, ...items: T[]) => {
  return items.some((i) => set.has(i))
}

export class ContextMenu {
  private readonly node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number
  private readonly actions: Actions
  private readonly props?: EditableBlockProps
  public constructor(
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number,
    actions: Actions = {},
    props?: EditableBlockProps
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.actions = actions
    this.props = props
  }

  public showAddMenu = (target: Element, after: boolean) => {
    const menu = document.createElement('div')
    menu.className = 'menu'
    const $pos = this.resolvePos()
    // we don`t want to add section after 'REFERENCES'
    if (isInBibliographySection($pos)) {
      after = false
    }
    const insertPos = after ? $pos.after($pos.depth) : $pos.before($pos.depth)
    const endPos = $pos.end()
    const types = this.insertableTypes(after, insertPos, endPos)

    const insertNode = (type: ManuscriptNodeType, pos?: number) => {
      const { state, dispatch } = this.view

      if (pos === undefined) {
        pos = after ? this.getPos() + this.node.nodeSize : this.getPos()
      }

      createBlock(type, pos, state, dispatch)
    }

    if (hasAny(types, 'section', 'subsection')) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const sectionTitle = $pos.node($pos.depth).child(0).textContent
          const itemTitle = sectionTitle
            ? `“${this.trimTitle(sectionTitle, 30)}”`
            : 'This Section'

          if (types.has('section')) {
            const labelPosition = after ? 'After' : 'Before'
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
            const level = sectionLevel($pos.depth)
            const label = `New ${level} to ${itemTitle}`

            section.appendChild(
              this.createMenuItem(label, () => {
                insertNode(schema.nodes.section, endPos)
                popper.destroy()
              })
            )
          }
        })
      )
    }

    if (hasAny(types, 'paragraph', 'ordered_list', 'bullet_list')) {
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

          if (types.has('ordered_list')) {
            section.appendChild(
              this.createMenuItem('Numbered List', () => {
                insertNode(schema.nodes.ordered_list)
                popper.destroy()
              })
            )
          }

          if (types.has('bullet_list')) {
            section.appendChild(
              this.createMenuItem('Bullet List', () => {
                insertNode(schema.nodes.bullet_list)
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
    const type = this.node.type

    if (listTypes.includes(type)) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          if (type === schema.nodes.bullet_list) {
            section.appendChild(
              this.createMenuItem('Change to Numbered List', () => {
                this.changeNodeType(schema.nodes.ordered_list)
                popper.destroy()
              })
            )
          }

          if (type === schema.nodes.ordered_list) {
            section.appendChild(
              this.createMenuItem('Change to Bullet List', () => {
                this.changeNodeType(schema.nodes.bullet_list)
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

    if (type === schema.nodes.table_element) {
      // Check if the selection is inside the table.
      const isInTable = hasParentNodeOfType(schema.nodes.table)(
        this.view.state.selection
      )
      const tableElementFooter = findChildrenByType(
        this.node,
        schema.nodes.table_element_footer
      )
      let isDeletedOrRejected = false

      const hasGeneralNote =
        tableElementFooter.length &&
        tableElementFooter[0].node.firstChild?.type === schema.nodes.paragraph

      if (hasGeneralNote) {
        const generalFootnote = tableElementFooter[0]?.node.firstChild
        if (generalFootnote) {
          isDeletedOrRejected =
            isDeleted(generalFootnote) || isRejectedInsert(generalFootnote)
        }
      }
      if (!hasGeneralNote || isDeletedOrRejected) {
        menu.appendChild(
          this.createMenuSection((section: HTMLElement) => {
            section.appendChild(
              this.createMenuItem('Add General Note', () => {
                insertGeneralFootnote(
                  this.node,
                  this.getPos(),
                  this.view,
                  tableElementFooter
                )
              })
            )
          })
        )
      }

      if (isInTable) {
        menu.appendChild(
          this.createMenuSection((section: HTMLElement) => {
            section.appendChild(
              this.createMenuItem('Add Reference Note', () => {
                const footnotesElementWithPos = findChildrenByType(
                  this.node,
                  schema.nodes.footnotes_element
                ).pop()
                if (
                  !footnotesElementWithPos ||
                  !footnotesElementWithPos?.node.content.childCount ||
                  isDeleted(footnotesElementWithPos.node) ||
                  isRejectedInsert(footnotesElementWithPos.node)
                ) {
                  insertTableFootnote(this.node, this.getPos(), this.view)
                } else {
                  const tablesFootnoteLabels = buildTableFootnoteLabels(
                    this.node
                  )

                  const footnotesWithPos = findChildrenByType(
                    footnotesElementWithPos.node,
                    schema.nodes.footnote
                  )

                  const footnotes = footnotesWithPos
                    // .filter(
                    //   ({ node }) => !isDeleted(node) && !isRejectedInsert(node)
                    // )
                    .map(({ node }) => ({
                      node: node,
                      index: tablesFootnoteLabels.get(node.attrs.id),
                    })) as FootnoteWithIndex[]

                  const targetDom = this.view.domAtPos(
                    this.view.state.selection.from
                  )
                  if (targetDom.node instanceof Element && this.props) {
                    const popperContainer = ReactSubView(
                      { ...this.props, dispatch: this.view.dispatch },
                      TableFootnotesSelector,
                      {
                        notes: footnotes,
                        onAdd: () => {
                          insertTableFootnote(
                            this.node,
                            this.getPos(),
                            this.view
                          )
                          this.props?.popper.destroy()
                        },
                        onInsert: (notes: FootnoteWithIndex[]) => {
                          const insertedAt = this.view.state.selection.to
                          let inlineFootnoteIndex = 1
                          this.view.state.doc
                            .slice(this.getPos(), insertedAt)
                            .content.descendants((node) => {
                              if (node.type === schema.nodes.inline_footnote) {
                                inlineFootnoteIndex++
                                return false
                              }
                            })

                          const node =
                            this.view.state.schema.nodes.inline_footnote.create(
                              {
                                rids: notes.map(({ node }) => node.attrs.id),
                                contents: notes
                                  .map(({ index }) =>
                                    index ? index : inlineFootnoteIndex
                                  )
                                  .join(),
                              }
                            ) as InlineFootnoteNode

                          const tr = this.view.state.tr

                          tr.insert(insertedAt, node)
                          this.view.dispatch(tr)
                          this.props?.popper.destroy()
                        },
                        onCancel: () => {
                          this.props?.popper.destroy()
                        },
                      },
                      this.node,
                      this.getPos,
                      this.view,
                      'table-footnote-editor'
                    )
                    this.props?.popper.show(
                      targetDom.node,
                      popperContainer,
                      'bottom-end'
                    )
                  }
                }
              })
            )
          })
        )
      }
    }

    if (
      !readonlyTypes.includes(type) &&
      !readonlyTypes.includes($pos.parent.type) &&
      !isGraphicalAbstractFigure($pos, type)
    ) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const nodeName = nodeNames.get(type) || ''

          section.appendChild(
            this.createMenuItem(`Delete ${nodeName}`, () => {
              this.deleteNode(type)
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
  ): Set<InsertableNodes> => {
    const { nodes } = schema

    const insertable = new Set<InsertableNodes>()

    const doc = this.view.state.doc

    const getPos = (pos?: number) => {
      if (pos === undefined) {
        pos = after ? this.getPos() + this.node.nodeSize : this.getPos()
      }
      return pos
    }

    const canInsertAt = (type: ManuscriptNodeType, pos?: number) => {
      const $pos = doc.resolve(getPos(pos))
      const index = $pos.index()
      return $pos.parent.canReplaceWith(index, index, type)
    }

    const checkNode = (node: Nodes, pos?: number) => {
      canInsertAt(nodes[node], pos) && insertable.add(node)
    }

    if (canInsertAt(nodes.section, endPos)) {
      insertable.add('subsection')
    }
    checkNode('section', insertPos)
    checkNode('paragraph')
    checkNode('ordered_list')
    checkNode('bullet_list')
    checkNode('figure_element')
    checkNode('table_element')
    checkNode('equation_element')
    checkNode('blockquote_element')
    checkNode('pullquote_element')

    return insertable
  }

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
          this.view.state.tr
            .setMeta('fromContextMenu', true)
            .delete($pos.before(), $pos.after())
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
    return title.length > max ? title.substring(0, max) + '…' : title
  }
}
