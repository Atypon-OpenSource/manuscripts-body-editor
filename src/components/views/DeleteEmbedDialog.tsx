/*!
 * © 2023 Atypon Systems LLC
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
import { EmbedNode } from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'

import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'

const DeleteEmbedDialog: React.FC<{
  deleteNode: () => void
}> = ({ deleteNode }) => {
  const [isOpen, setOpen] = useState(true)

  return (
    <Dialog
      isOpen={isOpen}
      actions={{
        primary: {
          action: () => {
            deleteNode()
            setOpen(false)
          },
          title: 'Delete',
        },
        secondary: {
          action: () => setOpen(false),
          title: 'Cancel',
        },
      }}
      category={Category.confirmation}
      header={'Delete Media'}
      message={
        <>
          <span>This action will delete the media from the page.</span>
          <br />
          <br />
          <span>Do you want to continue?</span>
        </>
      }
    />
  )
}

export const openDeleteEmbedDialog = (
  view: EditorView,
  node: EmbedNode,
  pos: number
) => {
  const { state, dispatch } = view
  const props = getEditorProps(state)

  const dialog = ReactSubView(
    props,
    DeleteEmbedDialog,
    {
      deleteNode: () => {
        const from = pos
        const to = from + node.nodeSize
        dispatch(state.tr.delete(from, to))
      },
    },
    state.doc,
    () => 0,
    view
  )

  document.body.appendChild(dialog)
}
