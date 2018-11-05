import {
  BibliographyItem,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { History, UnregisterCallback } from 'history'
import {
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import React from 'react'
import { ApplyLocalStep, ApplyRemoteStep } from '../lib/conflicts'
import { transformPasted } from '../lib/paste'
import { PopperManager } from '../lib/popper'
import plugins from '../plugins'
import { schema } from '../schema'
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptSchema,
} from '../schema/types'
import { Build } from '../transformer/builders'
import { ChangeReceiver } from '../types'
import views from '../views'

export interface EditorProps {
  attributes?: { [key: string]: string }
  autoFocus?: boolean
  getCitationProcessor: () => Citeproc.Processor
  doc: ManuscriptNode
  editable?: boolean
  getModel: <T extends Model>(id: string) => T | undefined
  saveModel: <T extends Model>(model: Build<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  applyLocalStep: ApplyLocalStep
  applyRemoteStep: ApplyRemoteStep
  addLibraryItem: (item: BibliographyItem) => void
  filterLibraryItems: (query: string) => BibliographyItem[]
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getManuscript: () => Manuscript
  saveManuscript?: (manuscript: Partial<Manuscript>) => Promise<void>
  addManuscript?: () => Promise<void>
  deleteManuscript: (id: string) => Promise<void>
  importManuscript: (models: Model[]) => Promise<void>
  exportManuscript: (format: string) => Promise<void>
  locale: string
  onChange?: (state: ManuscriptEditorState, docChanged: boolean) => void
  subscribe?: (receive: ChangeReceiver) => void
  modelMap: Map<string, Model>
  popper: PopperManager
  setView?: (view: ManuscriptEditorView) => void
  manuscript: Manuscript
  projectID: string
  getCurrentUser: () => UserProfile
  history: History
  handleSectionChange: (section: string) => void
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  CitationEditor: React.ComponentType<any> // tslint:disable-line:no-any
  importFile: (file: File) => Promise<Model[]>
  openFilePicker: () => Promise<File>
}

export class Editor extends React.PureComponent<EditorProps> {
  private readonly view: ManuscriptEditorView

  private readonly editorRef: React.RefObject<HTMLDivElement>

  private unregisterHistoryListener?: UnregisterCallback

  constructor(props: EditorProps) {
    super(props)

    this.editorRef = React.createRef()

    this.view = new EditorView(undefined, {
      editable: () => Boolean(this.props.editable),
      state: EditorState.create<ManuscriptSchema>({
        doc: this.props.doc,
        schema,
        plugins: plugins(this.props),
      }),
      dispatchTransaction: this.dispatchTransaction,
      nodeViews: views(this.props),
      attributes: this.props.attributes,
      transformPasted,
    })
  }

  public componentDidMount() {
    this.editorRef.current!.appendChild(this.view.dom)

    if (this.props.subscribe) {
      this.props.subscribe(this.receive)
    }

    if (this.props.onChange) {
      this.props.onChange(this.view.state, false)
    }

    if (this.props.setView) {
      this.props.setView(this.view)
    }

    // dispatch a transaction so that plugins run
    this.view.dispatch(this.view.state.tr.setMeta('update', true))

    if (this.props.autoFocus) {
      this.view.focus()
    }

    this.handleHistoryChange()

    this.unregisterHistoryListener = this.props.history.listen(
      this.handleHistoryChange
    )
  }

  public componentWillUnmount() {
    if (this.unregisterHistoryListener) {
      this.unregisterHistoryListener()
    }
  }

  public render() {
    return <div ref={this.editorRef} />
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
      if (this.props.onChange) {
        this.props.onChange(state, transactions.some(tr => tr.docChanged))
      }
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

        switch (newNode.type.name) {
          // TODO: can anything else be inserted by itself?
          // TODO: subsections! need to use the path
          case 'section':
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
          let tr = state.tr

          if (node.attrs.id === id) {
            // TODO: only do this if attributes changed?
            tr = tr.setNodeMarkup(pos, undefined, newNode.attrs) // TODO: merge attrs?

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

                tr = state.tr.replace(
                  pos + start + 1,
                  pos + nodeDiffEnd + 1,
                  newNode.slice(start, newNodeDiffEnd)
                )
              }
            }

            // tr = tr.replaceWith(pos, pos + node.nodeSize, newNode)

            // TODO: map selection through changes?
            // tr = tr.setSelection(state.selection).setMeta('addToHistory', false)

            tr = tr.setMeta('addToHistory', false)

            this.dispatchTransaction(tr, true)
            // this.view.dispatch(tr)

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
            // this.view.dispatch(tr)

            return false
          }
        })
        break
    }

    // TODO: find the updated node and replace it
    // TODO: find the deleted node and delete it
    // TODO: add an added component
  }

  private handleHistoryChange = () => {
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
