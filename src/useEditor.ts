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

import { Schema as ProsemirrorSchema } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useRef, useState } from 'react'

export type Command<Schema extends ProsemirrorSchema> = (
  state: EditorState<Schema>,
  dispatch?: (tr: Transaction) => void
) => boolean

export type CreateView = (
  element: HTMLDivElement,
  state: EditorState,
  dispatch: (tr: Transaction) => EditorState
) => EditorView

export interface EditorHookValue<Schema extends ProsemirrorSchema> {
  state: EditorState<Schema>
  onRender: (el: HTMLDivElement) => void
  isCommandValid: (command: Command<Schema>) => boolean
  doCommand: (command: Command<Schema>) => boolean
  replaceState: (state: EditorState<Schema>) => void
  dispatch: (tr: Transaction) => EditorState<Schema>
  view?: EditorView<Schema>
}

const useEditor = <Schema extends ProsemirrorSchema>(
  initialState: EditorState,
  createView: CreateView
): EditorHookValue<Schema> => {
  const view = useRef<EditorView>()
  const [state, setState] = useState<EditorState<Schema>>(initialState)

  const dispatch = useCallback(
    (tr: Transaction) => {
      if (!view.current) {
        return state
      }

      const nextState = view.current.state.apply(tr)
      view.current.updateState(nextState)

      // TODO: this part should be debounced??
      setState(nextState)

      return state
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const onRender = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      return
    }
    view.current = createView(el, state, dispatch)
    setState(view.current.state)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isCommandValid = useCallback(
    (command: Command<Schema>): boolean => command(state),
    [state]
  )

  const doCommand = useCallback(
    (command: Command<Schema>): boolean => command(state, dispatch),
    [state, dispatch]
  )

  const replaceState = useCallback((state: EditorState) => {
    setState(state)
    if (view.current) {
      view.current.updateState(state)
    }
  }, [])

  return {
    // ordinary use:
    state,
    onRender,
    isCommandValid,
    doCommand,
    replaceState,

    // advanced use:
    view: view.current,
    dispatch,
  }
}

export default useEditor

// interface FaccProps<Schema extends ProsemirrorSchema> {
//   initialState: EditorState
//   createView: CreateView
//   children: (hookValue: HookValue<Schema>) => JSX.Element
// }

// const EditorStateComponent: React.FC<FaccProps<Schema>> = ({
//   initialState,
//   createView,
//   children,
// }) => {
//   const editorProps = useEditor(initialState, createView)

//   return children(editorProps)
// }
