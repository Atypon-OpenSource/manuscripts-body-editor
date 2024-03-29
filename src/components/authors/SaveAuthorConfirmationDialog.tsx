/*!
 * © 2024 Atypon Systems LLC
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
import React from 'react'

export interface SaveAuthorConfirmationDialogProps {
  isOpen: boolean
  onSave: () => void
  onCancel: () => void
}

export const SaveAuthorConfirmationDialog: React.FC<
  SaveAuthorConfirmationDialogProps
> = ({ isOpen, onSave, onCancel }) => {
  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header="You've made changes to this option"
      message="Would you like to save or discard your changes?"
      actions={{
        secondary: {
          action: onCancel,
          title: 'Discard',
        },
        primary: {
          action: onSave,
          title: 'Save',
        },
      }}
    />
  )
}
