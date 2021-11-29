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

import 'prosemirror-view/style/prosemirror.css'
import '../lib/smooth-scroll'

import { CitationProvider } from '@manuscripts/library'
import {
  Build,
  ManuscriptEditorView,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Model,
  // Section,
} from '@manuscripts/manuscripts-json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { LocationListener } from 'history'
import {
  EditorState,
  NodeSelection,
  Plugin,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'

import { transformPasted } from '../lib/paste'
import {
  childSectionCoordinates,
  diffReplacementBlocks,
  findDescendantById,
} from '../lib/section-sync'
import plugins from '../plugins/editor'
import { EditorProps } from '../typings/editor'
import { ChangeReceiver, ChangeReceiverCommand } from '../typings/utils'
import views from '../views/editor'
import { ViewerProps } from './Viewer'

export interface EditorProps extends ViewerProps {
  autoFocus?: boolean
  getCitationProvider: () => CitationProvider | undefined
  plugins: Array<Plugin<ManuscriptSchema>>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  putAttachment: (
    id: string,
    attachment: RxAttachmentCreator
  ) => Promise<RxAttachment<Model>>
  removeAttachment: (id: string, attachmentID: string) => Promise<void>
  deleteModel: (id: string) => Promise<string>
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  subscribe: (receive: ChangeReceiver) => void
  setView: (view: ManuscriptEditorView) => void
  retrySync: (componentIDs: string[]) => Promise<void>
  handleStateChange: (view: ManuscriptEditorView, docChanged: boolean) => void
  setCommentTarget: (commentTarget?: string) => void
  jupyterConfig: {
    url: string
    token: string
    disabled: boolean
  }
  permissions: {
    write: boolean
  }
  capabilites?: Capabilities
  components: Record<string, React.ComponentType<any>> // eslint-disable-line @typescript-eslint/no-explicit-any
  environment?: string
}

export class Editor extends React.PureComponent<EditorProps> {
  private readonly editorRef = React.createRef<HTMLDivElement>()
  private readonly view: ManuscriptEditorView

  private unregisterHistoryListener?: () => void

  private isMouseDown = false

  constructor(props: EditorProps) {
    super(props)

    const { attributes, doc, environment, handleStateChange, permissions } =
      this.props

    this.view = new EditorView(undefined, {
      editable: () => permissions.write,
      state: EditorState.create<ManuscriptSchema>({
        doc,
        schema,
        plugins: plugins(this.props),
      }),
      scrollMargin: {
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
      },
      dispatchTransaction: this.dispatchTransaction,
      nodeViews: views(this.props),
      attributes,
      transformPasted,
      handleDOMEvents: {
        focus: () => {
          handleStateChange(this.view, false)

          if (!this.isMouseDown) {
            this.view.focus()
          }

          return false
        },
      },
    })

    if (environment === 'development') {
      import('prosemirror-dev-tools')
        .then(({ applyDevTools }) => applyDevTools(this.view))
        .catch((error) => {
          console.error(
            'There was an error loading prosemirror-dev-tools',
            error.message
          )
        })
    }
  }

  public componentDidMount() {
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)

    if (this.editorRef.current) {
      this.editorRef.current.appendChild(this.view.dom)
    }

    this.props.subscribe(this.receive)
    this.props.handleStateChange(this.view, false)
    this.props.setView(this.view)

    // dispatch a transaction so that plugins run
    this.view.dispatch(this.view.state.tr.setMeta('update', true))

    if (this.props.autoFocus) {
      this.view.focus()
    }

    this.handleHistoryChange(this.props.history.location, 'PUSH')

    this.unregisterHistoryListener = this.props.history.listen(
      this.handleHistoryChange
    )
  }

  public componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)

    if (this.unregisterHistoryListener) {
      this.unregisterHistoryListener()
    }
  }

  public render() {
    return <div ref={this.editorRef} />
  }

  private handleMouseDown = () => {
    this.isMouseDown = true
  }

  private handleMouseUp = () => {
    this.isMouseDown = false
  }

  private dispatchTransaction = (
    transaction: Transaction,
    external = false
  ) => {
    const { state, transactions } =
      this.view.state.applyTransaction(transaction)

    this.view.updateState(state)

    if (!external) {
      this.props.handleStateChange(
        this.view,
        transactions.some((tr) => tr.docChanged)
      )
    }
  }

  private receive: ChangeReceiver = (op, id, newNode, command) => {
    const { state } = this.view

    console.log({ op, id, newNode, command })

    if (op === 'ORDER_CHILD_SECTIONS') {
      return this.orderChildSections(id, command)
    }

    if (!id) {
      return
    }

    switch (op) {
      case 'INSERT':
        if (!newNode) {
          // tell the editor to update
          return this.dispatchTransaction(
            state.tr.setMeta('update', true),
            true
          )
        }

        switch (newNode.type) {
          // TODO: can anything else be inserted by itself?
          // TODO: subsections! need to use the path
          case state.schema.nodes.section:
            // do nothing, allow section update to take care of this
            break

          default: {
            // if an element arrives after the section update (which referenced this new element)
            // find the placeholder element and replace
            const {
              schema: { nodes },
              tr,
            } = state

            state.doc.descendants((node, pos) => {
              if (
                node.attrs.id === id &&
                (node.type === nodes.placeholder_element ||
                  node.type === nodes.placeholder)
              ) {
                tr.replaceWith(pos, pos + node.nodeSize, newNode)
                tr.setMeta('addToHistory', false)
                this.dispatchTransaction(tr, true)
                return false
              }
            })
            break
          }
        }
        break

      case 'UPDATE':
        if (!newNode) {
          // tell the editor to update
          return this.dispatchTransaction(
            state.tr.setMeta('update', true),
            true
          )
        }

        // TODO: add to a waitlist if child nodes aren't in the map yet?
        // TODO: make sure there aren't any local edits since saving?
        state.doc.descendants((node, pos) => {
          const tr = state.tr

          if (node.attrs.id === id) {
            // TODO: only do this if attributes changed?
            tr.setNodeMarkup(pos, undefined, newNode.attrs) // TODO: merge attrs?

            // from https://prosemirror.net/examples/footnote/
            const start = newNode.content.findDiffStart(node.content)

            if (typeof start === 'number') {
              // TODO: remove "any" when types are fixed
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const diffEnd = newNode.content.findDiffEnd(node.content as any)

              if (diffEnd) {
                let { a: newNodeDiffEnd, b: nodeDiffEnd } = diffEnd

                const overlap = start - Math.min(nodeDiffEnd, newNodeDiffEnd)

                if (overlap > 0) {
                  nodeDiffEnd += overlap
                  newNodeDiffEnd += overlap
                }

                tr.replace(
                  pos + start + 1,
                  pos + nodeDiffEnd + 1,
                  newNode.slice(start, newNodeDiffEnd)
                )
              }
            }

            // TODO: map selection through changes?
            // tr.setSelection(state.selection.map(tr.doc, tr.mapping))

            tr.setMeta('addToHistory', false)

            this.dispatchTransaction(tr, true)

            return false
          }
        })
        break

      case 'REMOVE':
        state.doc.descendants((node, pos) => {
          if (node.attrs.id === id) {
            const tr = state.tr
              .delete(pos, pos + node.nodeSize)
              .setMeta('addToHistory', false)

            this.dispatchTransaction(tr, true)

            return false
          }
        })
        break
    }
  }

  private orderChildSections = (
    parent?: string,
    command?: ChangeReceiverCommand
  ) => {
    if (!command || !command.childSections) {
      return
    }

    const {
      state: { doc, tr },
    } = this.view

    const { node, offset } = parent
      ? findDescendantById(doc, parent)
      : { node: doc, offset: 0 }

    if (!node || offset === undefined) {
      return
    }

    const coords = childSectionCoordinates(node)

    const diff = diffReplacementBlocks(coords, command.childSections)

    if (!diff.remove && !diff.insert.length) {
      return
    }

    if (!diff.remove) {
      const pos =
        offset +
        (coords[diff.start] ? coords[diff.start].start : node.content.size)
      tr.insert(pos, diff.insert)
    } else {
      const startOfSplice = offset + coords[diff.start].start
      const endOfSplice = offset + coords[diff.start + diff.remove - 1].end
      tr.replaceWith(startOfSplice, endOfSplice, diff.insert)
    }

    tr.setMeta('addToHistory', false)
    this.dispatchTransaction(tr, false)
  }

  private handleHistoryChange: LocationListener = (location) => {
    this.focusNodeWithId(location.hash.substring(1))
  }

  private focusNodeWithId(id: string) {
    if (!id || !this.view) {
      return
    }

    const { state } = this.view

    state.doc.descendants((node, pos) => {
      if (node.attrs.id === id) {
        this.view.focus()

        const selection = node.isAtom
          ? NodeSelection.create(state.tr.doc, pos)
          : TextSelection.near(state.tr.doc.resolve(pos + 1))

        this.dispatchTransaction(state.tr.setSelection(selection))

        const dom = this.view.domAtPos(pos + 1)

        if (dom.node instanceof Element) {
          dom.node.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          })
        }

        return false
      }
    })
  }
}
