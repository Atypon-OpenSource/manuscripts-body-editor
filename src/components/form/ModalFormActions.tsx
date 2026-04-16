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
import { PrimaryButton } from '@manuscripts/style-guide'
import React from 'react'

import { ConfirmationDialog, DialogType } from '../dialog/ConfirmationDialog'
import styled from 'styled-components'

export interface ModalFormSaveButtonProps {
  form: string
  newEntity: boolean
  isDisableSave: boolean
  onSubmitForm?: () => void | Promise<void>
  createLabel?: string
  updateLabel?: string
}

export const ModalFormSaveButton: React.FC<ModalFormSaveButtonProps> = ({
  form,
  newEntity,
  isDisableSave,
  onSubmitForm,
  createLabel,
  updateLabel,
}) => {
  const label = newEntity
    ? (createLabel ?? 'Save Changes')
    : (updateLabel ?? 'Update Changes')

  const saveButton = onSubmitForm ? (
    <StylePrimaryButton
      disabled={isDisableSave}
      type="button"
      onClick={() => {
        if (!isDisableSave) {
          void onSubmitForm()
        }
      }}
    >
      {label}
    </StylePrimaryButton>
  ) : (
    <StylePrimaryButton disabled={isDisableSave} type="submit" form={form}>
      {label}
    </StylePrimaryButton>
  )

  return saveButton
}

export interface ModalFormActionsProps {
  type: string
  onDelete: () => void
  showingDeleteDialog: boolean
  showDeleteDialog: () => void
}

export const ModalFormActions: React.FC<ModalFormActionsProps> = ({
  type,
  onDelete,
  showingDeleteDialog,
  showDeleteDialog,
}) => {
  return (
    <ConfirmationDialog
      isOpen={showingDeleteDialog}
      onPrimary={() => {
        onDelete()
        showDeleteDialog()
      }}
      onSecondary={showDeleteDialog}
      type={DialogType.DELETE}
      entityType={type}
    />
  )
}

const StylePrimaryButton = styled(PrimaryButton)`
  min-width: 145px;
`
