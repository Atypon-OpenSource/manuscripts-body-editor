/*!
 * © 2021 Atypon Systems LLC
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
import { Category, Dialog } from '@manuscripts/style-guide'
import { Command } from 'prosemirror-state'
import { EditorState, Transaction } from 'prosemirror-state'
import React, { useCallback, useState } from 'react'

interface ChildProps<State> {
  state: State
  handleChange: (key: string, value: string) => void
}

interface ModalProps<State> {
  handleCloseDialog: () => void
  editorState: EditorState
  dispatch: (tr: Transaction) => void
  selector: (editorState: EditorState) => State
  command: (state: State) => Command
  header: string
  children: (props: ChildProps<State>) => JSX.Element
}

// Old-school function notation is the only way to use type parameters in a
// React component
/* tslint:disable-next-line:only-arrow-functions */
export function Modal<State>({
  handleCloseDialog,
  editorState,
  dispatch,
  selector,
  command,
  header,
  children,
}: ModalProps<State>) {
  const [state, setState] = useState<State>(selector(editorState))

  const handleChange = useCallback(
    (key: string, value: string) =>
      setState((prevState) => ({
        ...prevState,
        [key]: value,
      })),
    []
  )

  const handleOK = useCallback(() => {
    command(state)(editorState, dispatch)
    handleCloseDialog()
  }, [state, editorState, dispatch, command, handleCloseDialog])

  return (
    <Dialog
      category={Category.confirmation}
      header={header}
      isOpen={true}
      actions={{
        primary: {
          action: handleOK,
          title: 'OK',
          isDestructive: false,
        },
        secondary: {
          action: handleCloseDialog,
          title: 'Cancel',
        },
      }}
      message={children({ state, handleChange })}
    />
  )
}
