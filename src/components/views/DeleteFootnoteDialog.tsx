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
import React, { useState } from 'react'

export interface DeleteFootnoteDialogProps {
  header: string
  message: string
  handleDelete: () => void
}

export const DeleteFootnoteDialog: React.FC<DeleteFootnoteDialogProps> = ({
  header,
  message,
  handleDelete,
}) => {
  const [isOpen, setOpen] = useState(true)

  return (
    <Dialog
      className="delete-footnote-dialog"
      isOpen={isOpen}
      actions={{
        primary: {
          action: () => {
            setOpen(false)
            handleDelete()
          },
          title: 'Delete',
        },
        secondary: {
          action: () => setOpen(false),
          title: 'Cancel',
        },
      }}
      category={Category.confirmation}
      header={header}
      message={message}
    />
  )
}
