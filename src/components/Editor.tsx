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
  Build,
  ManuscriptEditorView,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import { BibliographyItem, Model } from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'
import { LocationListener, UnregisterCallback } from 'history'
import {
  EditorState,
  NodeSelection,
  Plugin,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import React from 'react'
import { RxAttachment, RxAttachmentCreator } from 'rxdb'
import { transformPasted } from '../lib/paste'
import '../lib/smooth-scroll'
import plugins from '../plugins/editor'
import { ChangeReceiver } from '../types'
import views from '../views/editor'
import { ViewerProps } from './Viewer'

export interface EditorProps extends ViewerProps {
  autoFocus?: boolean
  getCitationProcessor: () => CiteProc.Engine | undefined
  plugins: Array<Plugin<ManuscriptSchema>>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  putAttachment: (
    id: string,
    attachment: RxAttachmentCreator
  ) => Promise<RxAttachment<Model>>
  removeAttachment: (id: string, attachmentID: string) => Promise<void>
  deleteModel: (id: string) => Promise<string>
  addLibraryItem: (item: BibliographyItem) => void
  filterLibraryItems: (query: string) => BibliographyItem[]
  subscribe: (receive: ChangeReceiver) => void
  setView: (view: ManuscriptEditorView) => void
  retrySync: (componentIDs: string[]) => Promise<void>
  handleStateChange: (view: ManuscriptEditorView, docChanged: boolean) => void
  setCommentTarget: (commentTarget?: string) => void
  jupyterConfig: {
    url: string
    token: string
  }
  permissions: {
    write: boolean
  }
  components: {
    [key: string]: React.ComponentType<any> // tslint:disable-line:no-any
  }
}

export class Editor extends React.PureComponent<EditorProps> {
  private readonly editorRef = React.createRef<HTMLDivElement>()
  private readonly view: ManuscriptEditorView

  private unregisterHistoryListener?: UnregisterCallback

  private isMouseDown: boolean = false

  constructor(props: EditorProps) {
    super(props);

    const { attributes, doc, handleStateChange, permissions } = this.props
    debugger;
    console.log(schema);
    this.view = new EditorView(undefined, {
      editable: () => permissions.write,
      state: EditorState.create<ManuscriptSchema>({
        doc,
        schema,
        plugins: plugins(this.props),
      }),
      scrollThreshold: 100,
      // @ts-ignore (types)
      scrollMargin: {
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
      },
      dispatchTransaction: this.dispatchTransaction,
      //@ts-ignore
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
    external: boolean = false
  ) => {
    const { state, transactions } = this.view.state.applyTransaction(
      transaction
    )

    this.view.updateState(state)

    if (!external) {
      this.props.handleStateChange(
        this.view,
        transactions.some(tr => tr.docChanged)
      )
    }
  }

  private receive: ChangeReceiver = (op, id, newNode) => {
    const { state } = this.view

    if (!id) {
      return
    }

    console.log({ op, id, newNode }) // tslint:disable-line:no-console

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
            // +1 for manuscript
            const sectionIndex = newNode.attrs.priority + 1

            state.doc.forEach((node, offset, index) => {
              if (index === sectionIndex) {
                this.dispatchTransaction(state.tr.insert(offset, newNode), true)
                return false
              }
            })

            // TODO: insert at the end if no matching index? Should already be ok because of bibliography section?
            break
          default:
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
              // tslint:disable-next-line:no-any - TODO: remove once types are fixed
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
            // tr.setSelection(state.selection)

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

  private handleHistoryChange: LocationListener = location => {
    this.focusNodeWithId(location.hash.substring(1))
  }

  private focusNodeWithId(id: string) {
    if (!id || !this.view) return

    const { state } = this.view

    state.doc.descendants((node, pos) => {
      if (node.attrs.id === id) {
        this.view.focus()

        const selection = node.isAtom
          ? NodeSelection.create(state.doc, pos)
          : TextSelection.near(state.doc.resolve(pos + 1))

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
