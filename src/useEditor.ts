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

import { receiveTransaction, sendableSteps } from 'prosemirror-collab'
import {
  Command,
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { Step } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { EditorProps } from './configs/ManuscriptsEditor'
export type CreateView = (
  element: HTMLDivElement,
  state: EditorState,
  dispatch: (tr: Transaction) => EditorState
) => EditorView

// @TODO move type to quarterback plugin or styleguide BEFORE MERGING
export abstract class CollabProvider {
  readonly steps: Step[]
  currentVersion: number
  stepClientIDs: number[]
  abstract sendSteps(
    version: number,
    steps: readonly Step[],
    clientID: string | number
  ): Promise<void>
  abstract onNewSteps(
    listener: (steps: Step[], clientIDs: string[]) => void
  ): void
}

const useEditor = (
  initialState: EditorState,
  createView: CreateView,
  editorProps: EditorProps
) => {
  const view = useRef<EditorView>()
  const [state, setState] = useState<EditorState>(initialState)
  const [viewElement, setViewElement] = useState<HTMLDivElement | null>(null)
  const history = useHistory()

  // Receiving steps from the backend
  console.log(editorProps.collabProvider)
  if (editorProps.collabProvider) {
    editorProps.collabProvider.onNewSteps((steps, clientIDs) => {
      if (state) {
        // @TODO: make sure received steps are ignored by the quarterback plugin
        receiveTransaction(state, steps, clientIDs)
      }
    })
  }

  const dispatch = useCallback(
    (tr: Transaction) => {
      if (!view.current) {
        return state
      }

      const nextState = view.current.state.apply(tr)
      view.current.updateState(nextState)

      if (editorProps.collabProvider) {
        const sendable = sendableSteps(nextState)
        if (sendable) {
          editorProps.collabProvider.sendSteps(
            sendable.version,
            sendable.steps,
            sendable.clientID
          )
        }
      }

      // TODO: this part should be debounced??
      setState(nextState)

      return state
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const replaceView = (state: EditorState, createView: CreateView) => {
    if (viewElement && view.current) {
      view.current.destroy()
      view.current = createView(viewElement, state, dispatch)
      setState(view.current.state)
    }
  }
  const onRender = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      return
    }
    view.current = createView(el, view.current?.state || state, dispatch)
    setState(view.current.state)
    setViewElement(el)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isCommandValid = useCallback(
    (command: Command): boolean => command(state),
    [state]
  )

  const doCommand = useCallback(
    (command: Command): boolean => command(state, dispatch, view.current),
    [state, dispatch]
  )

  const replaceState = useCallback((state: EditorState) => {
    setState(state)
    if (view.current) {
      view.current.updateState(state)
    }
  }, [])

  const focusNodeWithId = useCallback(
    (id: string) => {
      const currentView = view.current
      if (!id || !currentView || !state) {
        return
      }

      state.doc.descendants((node, pos) => {
        if (node.attrs.id === id) {
          currentView.focus()

          const selection = node.isAtom
            ? NodeSelection.create(state.tr.doc, pos)
            : TextSelection.near(state.tr.doc.resolve(pos + 1))

          currentView.dispatch(state.tr.setSelection(selection))
          const dom = currentView.domAtPos(pos + 1)

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
    },
    [state]
  )

  useEffect(() => {
    const unlisten = history.listen(() => {
      // This will be evaluated on every route change. So, if
      // the route has changed and the node id is defined, we want to
      // focus that node.
      const nodeId = history.location.hash.substring(1)
      if (nodeId) {
        focusNodeWithId(nodeId)
      }
    })
    // This function will be invoked on component unmount and will clean up
    // the event listener.
    return () => {
      unlisten()
    }
  }, [history, focusNodeWithId])

  return {
    // ordinary use:
    state,
    onRender,
    isCommandValid,
    doCommand,
    replaceState,
    // advanced use:
    replaceView,
    view: view.current,
    dispatch,
  }
}

export default useEditor
