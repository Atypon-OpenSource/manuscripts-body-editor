/*!
 * © 2026 Atypon Systems LLC
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

import type { EditorView } from 'prosemirror-view'
import React, { useCallback, useEffect, useState } from 'react'

import {
  KEYBOARD_SHORTCUTS_MODAL_ID,
  KeyboardShortcutsModal,
} from '../components/views/KeyboardShortcutsModal'
import type { EditorProps } from '../configs/ManuscriptsEditor'
import { getEditorProps } from '../plugins/editor-props'
import ReactSubView from '../views/ReactSubView'

let activeKeyboardShortcutModal: boolean = false

type Props = {
  editorProps: EditorProps
  onDispose: () => void
}

const KeyboardShortcutsModalRequest: React.FC<Props> = ({
  editorProps,
  onDispose,
}) => {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) {
      queueMicrotask(onDispose)
    }
  }, [open, onDispose])

  return (
    <KeyboardShortcutsModal
      editorProps={editorProps}
      isOpen={open}
      onClose={handleClose}
    />
  )
}

export function openKeyboardShortcuts(view?: EditorView): void {
  if (!view) {
    return
  }

  if (activeKeyboardShortcutModal) {
    return
  }

  activeKeyboardShortcutModal = true

  const { state } = view
  const editorProps = getEditorProps(state)

  const cleanup = () => {
    activeKeyboardShortcutModal = false
    const modal = document.getElementById(KEYBOARD_SHORTCUTS_MODAL_ID)
    if (modal) {
      modal.remove()
    }
  }

  ReactSubView(
    editorProps,
    KeyboardShortcutsModalRequest,
    {
      editorProps,
      onDispose: cleanup,
    },
    state.doc,
    () => 0,
    view
  )
}
