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
  getListType,
  InlineFootnoteNode,
  isInBibliographySection,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
  Nodes,
  schema,
} from '@manuscripts/transform'
import { Attrs } from 'prosemirror-model'
import { findChildrenByType, hasParentNodeOfType } from 'prosemirror-utils'

import {
  addNodeComment,
  createBlock,
  findPosBeforeFirstSubsection,
  insertGeneralFootnote,
  insertTableFootnote,
} from '../commands'
import { FootnotesSelector } from '../components/views/FootnotesSelector'
import { EditorProps } from '../configs/ManuscriptsEditor'
import ReactSubView from '../views/ReactSubView'
import { buildTableFootnoteLabels, FootnoteWithIndex } from './footnotes'
import { PopperManager } from './popper'
import {
  getActualAttrs,
  isDeleted,
  isRejectedInsert,
} from './track-changes-utils'
import { getChildOfType, isChildOfNodeTypes } from './utils'

const popper = new PopperManager()

const readonlyTypes = [schema.nodes.keywords, schema.nodes.bibliography_element]

export const sectionLevel = (depth: number) => {
  switch (depth) {
    case 1:
      return 'Section'
    default:
      return 'Sub' + 'sub'.repeat(depth - 2) + 'section'
  }
}

interface Actions {
  addComment?: boolean
}

type InsertableNodes = Nodes | 'subsection'

const hasAny = <T>(set: Set<T>, ...items: T[]) => {
  return items.some((i) => set.has(i))
}

export const contextMenuBtnClass = 'btn-context-menu'
export class ContextMenu {
  private readonly node: ManuscriptNode
  private readonly view: ManuscriptEditorView
  private readonly getPos: () => number
  private readonly actions: Actions
  private readonly props?: EditorProps

  public constructor(
    node: ManuscriptNode,
    view: ManuscriptEditorView,
    getPos: () => number,
    actions: Actions = {},
    props?: EditorProps
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

    const insertNode = (
      type: ManuscriptNodeType,
      pos?: number,
      attrs?: Attrs
    ) => {
      const { state, dispatch } = this.view

      if (pos === undefined) {
        pos = after ? this.getPos() + this.node.nodeSize : this.getPos()
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
            const insPos = findPosBeforeFirstSubsection($pos) || endPos
            const level = sectionLevel($pos.depth)
            const label = `New ${level} to ${itemTitle}`

            section.appendChild(
              this.createMenuItem(label, () => {
                insertNode(schema.nodes.section, insPos, {
                  category: 'MPSectionCategory:subsection',
                })
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
              this.createMenuItem('Bullet List', () => {
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
    const type = this.node.type

    if (type === schema.nodes.list) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          const actualAttrs = getActualAttrs(this.node)
          const listType = getListType(actualAttrs.listStyleType).style
          if (listType === 'none' || listType === 'disc') {
            section.appendChild(
              this.createMenuItem('Change to Numbered List', () => {
                this.changeNodeType(null, 'order')
                popper.destroy()
              })
            )
          } else {
            section.appendChild(
              this.createMenuItem('Change to Bullet List', () => {
                this.changeNodeType(null, 'bullet')
                popper.destroy()
              })
            )
          }
        })
      )
    }

    const { addComment } = this.actions
    if (addComment) {
      menu.appendChild(
        this.createMenuSection((section: HTMLElement) => {
          section.appendChild(
            this.createMenuItem('Comment', () => {
              const target = this.getCommentTarget()
              addNodeComment(target, this.view.state, this.view.dispatch)
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
        getChildOfType(
          tableElementFooter[0].node,
          schema.nodes.general_table_footnote,
          true
        )

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
                    .filter(
                      ({ node }) => !isDeleted(node) && !isRejectedInsert(node)
                    )
                    .map(({ node }) => ({
                      node: node,
                      index: tablesFootnoteLabels.get(node.attrs.id),
                    })) as FootnoteWithIndex[]

                  const targetDom = this.view.domAtPos(
                    this.view.state.selection.from
                  )
                  const targetNode =
                    targetDom.node.nodeType === Node.TEXT_NODE
                      ? targetDom.node.parentNode
                      : targetDom.node

                  if (targetNode instanceof Element && this.props) {
                    const popperContainer = ReactSubView(
                      { ...this.props, dispatch: this.view.dispatch },
                      FootnotesSelector,
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
                              if (
                                node.type === schema.nodes.inline_footnote &&
                                !isRejectedInsert(node)
                              ) {
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
                      'footnote-editor'
                    )
                    this.props?.popper.show(
                      targetNode,
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
      !readonlyTypes.includes($pos.parent.type)
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

    popper.show(target, menu, 'right', true)

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
    checkNode('list')
    checkNode('figure_element')
    checkNode('table_element')
    checkNode('equation_element')
    checkNode('blockquote_element')
    checkNode('pullquote_element')

    return insertable
  }

  private changeNodeType = (
    nodeType: ManuscriptNodeType | null,
    listType: string
  ) => {
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(this.getPos(), nodeType, {
        id: this.node.attrs.id,
        listStyleType: listType,
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
    const mouseListener: EventListener = (event) => {
      const target = event.target as HTMLElement
      // if target is one of btn-context-menu buttons, do not destroy popper
      if (target.classList.contains(contextMenuBtnClass)) {
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
}
