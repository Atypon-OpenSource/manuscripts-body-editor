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
  trackChangesPluginKey,
  TrackChangesStatus,
} from '@manuscripts/track-changes-plugin'
import {
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab'
import {
  Command,
  EditorState,
  NodeSelection,
  Transaction,
} from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'

import {
  createEditorState,
  createEditorView,
  ExternalProps,
} from './configs/ManuscriptsEditor'
import { PopperManager } from './lib/popper'
import { useDoWithDebounce } from './lib/use-do-with-debounce'

export const useEditor = (externalProps: ExternalProps) => {
  const view = useRef<EditorView>()

  const props = { ...externalProps, popper: new PopperManager() }

  const [state, setState] = useState<EditorState>(() =>
    createEditorState(props)
  )
  const history = useHistory()
  const { collabProvider } = props

  // Receiving steps from backend
  if (collabProvider) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collabProvider.onNewSteps(async (newVersion, steps, clientIDs) => {
      if (state && view.current) {
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

  const debounce = useDoWithDebounce()

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
        (!trackState || trackState.status !== TrackChangesStatus.viewSnapshots)
      ) {
        const sendable = sendableSteps(nextState)

        if (sendable) {
          collabProvider.sendSteps(
            sendable.version,
            sendable.steps,
            sendable.clientID,
            false
          )
        }
      }

      debounce(
        () => {
          setState(nextState)
        },
        200,
        !tr.docChanged
      )

      return nextState
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const onRender = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      return
    }
    view.current = createEditorView(
      props,
      el,
      view.current?.state || state,
      dispatch
    )
    setState(view.current.state)
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

          const selection = NodeSelection.create(state.tr.doc, pos)

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
    state,
    onRender,
    isCommandValid,
    doCommand,
    replaceState,
    view: view.current,
    dispatch,
  }
}
