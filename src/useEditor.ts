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
import { schema } from '@manuscripts/transform'
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
import { Step } from 'prosemirror-transform'
import { EditorView } from 'prosemirror-view'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import {
  createEditorState,
  createEditorView,
  ExternalProps,
} from './configs/ManuscriptsEditor'
import { PopperManager } from './lib/popper'
import { useDoWithDebounce } from './lib/use-do-with-debounce'
import { searchReplaceKey } from './plugins/search-replace'

export const useEditor = (externalProps: ExternalProps) => {
  const view = useRef<EditorView>(undefined)

  const props = { ...externalProps, popper: new PopperManager() }

  const [state, setState] = useState<EditorState>(() =>
    createEditorState(props)
  )
  const location = useLocation()
  const { collabProvider } = props

  // Update editor state when document changes (e.g., when switching to comparison mode)
  useEffect(() => {
    if (view.current && props.isComparingMode) {
      const newState = createEditorState(props)
      setState(newState)
      view.current.updateState(newState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.doc, props.isComparingMode])

  useEffect(() => {
    // Receiving steps from backend
    if (collabProvider && !props.isComparingMode) {
      collabProvider.onNewSteps(
        async (broadcastedSteps?, broadcastedClientIDs?) => {
          if (state && view.current) {
            let steps: Step[]
            let clientIDs: number[]
            let version: number

            const localVersion = getVersion(view.current.state)
            const remoteVersion = collabProvider.currentVersion

            // Check for version gap: if we need more steps than we received,
            // we're missing some and need to fetch all via HTTP
            const stepsNeeded = remoteVersion - localVersion
            const stepsReceived = broadcastedSteps?.length ?? 0
            const hasVersionGap = stepsNeeded > stepsReceived

            if (
              broadcastedSteps?.length &&
              broadcastedClientIDs?.length &&
              !hasVersionGap
            ) {
              // Use the broadcasted steps directly - no extra HTTP request needed
              steps = broadcastedSteps.map((s) => Step.fromJSON(schema, s))
              clientIDs = broadcastedClientIDs
              version = remoteVersion
            } else {
              // Fallback to fetching: version gap, conflict recovery, or reconnection
              const since = await collabProvider.stepsSince(localVersion)
              if (!since) {
                return
              }
              steps = since.steps
              clientIDs = since.clientIDs
              version = since.version
            }

            /*
          Check if we already requested and applied steps for this version before. Duplicate request for the same version can happen 
          when websocket signals that there are new steps at about the same time when we send some new steps and get 409 as a response
          due to conflict with the very same steps in authority. It would result in double request and application of the same steps and
          forever desync (until page reload that is)
          */
            if (version <= getVersion(view.current.state)) {
              return
            }

            if (steps.length && clientIDs.length) {
              view.current.dispatch(
                receiveTransaction(
                  // has to be called for the collab to increment version and drop buffered steps
                  view.current.state,
                  steps,
                  clientIDs
                )
              )
            } else {
              console.warn('Inconsistent new steps event from the authority.')
            }
          }
        }
      )
    }
    return () => {
      collabProvider?.unsubscribe()
    }
  }, [collabProvider, props.isComparingMode, !!view.current]) // eslint-disable-line react-hooks/exhaustive-deps

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
        (!trackState ||
          trackState.status !== TrackChangesStatus.viewSnapshots) &&
        !props.isComparingMode
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
        250,
        !tr.isGeneric || !tr.docChanged || !tr.getMeta(searchReplaceKey)
      )

      return nextState
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const isViewingMode = props.isViewingMode

  const onRender = useCallback(
    (el: HTMLDivElement | null) => {
      if (view.current) {
        view.current.destroy()
        view.current = undefined
      }

      if (!el) {
        return
      }

      const freshState = createEditorState(props)
      view.current = createEditorView(props, el, freshState || state, dispatch)
      setState(view.current.state)
    },
    [isViewingMode] // eslint-disable-line react-hooks/exhaustive-deps
  )

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
    // This will be evaluated on every route change. So, if
    // the route has changed and the node id is defined, we want to
    // focus that node.
    const nodeId = location.hash.substring(1)
    if (nodeId) {
      focusNodeWithId(nodeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

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
