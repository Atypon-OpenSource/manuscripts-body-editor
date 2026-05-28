/*!
 * © 2025 Atypon Systems LLC
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
  AttentionOrangeIcon,
  Category,
  Dialog,
} from '@manuscripts/style-guide'
import { ManuscriptEditorView } from '@manuscripts/transform'
import React, { useState } from 'react'

import {
  findCrossReferencesToId,
  getSupplementDisplayLabel,
  performDeleteSupplement,
} from '../../lib/supplements'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'

const DeleteSupplementDialog: React.FC<{
  label: string
  crossRefCount: number
  onDelete: () => void
}> = ({ label, crossRefCount, onDelete }) => {
  const [isOpen, setOpen] = useState(true)

  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header={
        crossRefCount > 0 ? (
          <>
            <AttentionOrangeIcon />
            Delete supplement
          </>
        ) : (
          'Delete supplement'
        )
      }
      message={
        <>
          {crossRefCount > 0 && (
            <>
              This supplement is referenced by {crossRefCount} cross-reference
              {crossRefCount === 1 ? '' : 's'} in the manuscript. Deleting it may
              break those references.
              <br />
              <br />
            </>
          )}
          Are you sure you want to delete &ldquo;{label}&rdquo;?
        </>
      }
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

  const { state } = view
  const props = getEditorProps(state)
  const label = getSupplementDisplayLabel(
    node as import('@manuscripts/transform').SupplementNode,
    props.getFiles()
  )
  const crossRefCount = findCrossReferencesToId(
    state.doc,
    node.attrs.id
  ).length

  const dialog = ReactSubView(
    props,
    DeleteSupplementDialog,
    {
      label,
      crossRefCount,
      onDelete: () => performDeleteSupplement(view, pos),
    },
    state.doc,
    () => 0,
    view
  )

  document.body.appendChild(dialog)
}
