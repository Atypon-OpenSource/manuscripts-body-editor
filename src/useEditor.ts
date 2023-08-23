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
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab'
import {
  Command,
  EditorState,
  NodeSelection,
  TextSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { EditorProps } from './configs/ManuscriptsEditor'
import {
  TrackChangesStatus,
  trackChangesPluginKey,
} from '@manuscripts/track-changes-plugin'
export type CreateView = (
  element: HTMLDivElement,
  state: EditorState,
  dispatch: (tr: Transaction) => EditorState
) => EditorView

const useEditor = (
  initialState: EditorState,
  createView: CreateView,
  editorProps: EditorProps
) => {
  const view = useRef<EditorView>()
  const [state, setState] = useState<EditorState>(initialState)
  const [viewElement, setViewElement] = useState<HTMLDivElement | null>(null)
  const history = useHistory()
  const { collabProvider } = editorProps

  // Receiving steps from backend
  if (collabProvider) {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    collabProvider.onNewSteps(async (newVersion, steps, clientIDs) => {
      if (state && view.current) {
        // @TODO: make sure received steps are ignored by the quarterback plugin
        const localVersion = getVersion(view.current.state)

        // @TODO - save unconfirmed verison and compare it with newVersion to check if we can consume this update and don't have to call collabProvider.stepsSince
        // if (newVersion == lastLocalUnconfirmed) {
        //   view.current.dispatch(
        //     receiveTransaction(
        //       // has to be called for the collab to increment version and drop buffered steps
        //       view.current.state,
        //       steps,
        //       clientIDs
        //     )
        //   )
        // }

        const since = await collabProvider.stepsSince(localVersion)

        if (since?.steps && since.clientIDs) {
          view.current.dispatch(
            receiveTransaction(
              // has to be called for the collab to increment version and drop buffered steps
              view.current.state,
              since?.steps,
              since.clientIDs
            )
          )
        } else {
          console.warn('Inconsistent new steps event from the authority.')
        }
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

      const trackState = trackChangesPluginKey.getState(view.current.state)

      if (
        collabProvider &&
        trackState &&
        trackState.status !== TrackChangesStatus.viewSnapshots
      ) {
        const sendable = sendableSteps(nextState)
        if (sendable) {
          collabProvider.sendSteps(
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
