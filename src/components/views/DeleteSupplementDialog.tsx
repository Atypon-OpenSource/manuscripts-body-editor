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
import { Category, Dialog } from '@manuscripts/style-guide'
import { ManuscriptEditorView } from '@manuscripts/transform'
import React, { useState } from 'react'

import {
  performDeleteSupplement,
} from '../../lib/supplements'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'

interface DeleteSupplementDialogProps {
  onDelete: () => void
  onClose: () => void
}
const DeleteSupplementDialog: React.FC<DeleteSupplementDialogProps> = ({ onDelete, onClose }) => {
  const [isOpen, setOpen] = useState(true)

  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header="Delete supplement"
      message="Are you sure you want to delete &ldquo;{label}&rdquo;?"
      onExited={onClose}
      actions={{
        primary: {
          action: () => {
            onDelete()
            setOpen(false)
          },
          title: 'Delete',
        },
        secondary: {
          action: () => setOpen(false),
          title: 'Cancel',
        },
      }}
      portaled={false}
    />
  )
}

export const openDeleteSupplementDialog = (
  view: ManuscriptEditorView,
  pos: number
) => {
  const node = view.state.doc.nodeAt(pos)
  if (!node || node.type.name !== 'supplement') {
    return
  }

  let dialog: HTMLDivElement | null = null

  const { state } = view
  const props = getEditorProps(state)

  const dialogProps: DeleteSupplementDialogProps = {
      onDelete: () => performDeleteSupplement(view, pos),
      onClose: () => {
        dialog?.remove()
        dialog = null
      }
    }
   dialog = ReactSubView(
    props,
    DeleteSupplementDialog,
    dialogProps,
    state.doc,
    () => 0,
    view
  )

  document.body.appendChild(dialog)
}
