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
import { ButtonGroup, IconButton, PlusIcon } from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

import { DeleteAuthorConfirmationDialog } from './DeleteAuthorConfirmationDialog'

const AuthorActionsContainer = styled.div`
  display: flex;
`

const StyledButtonGroup = styled(ButtonGroup)`
  flex: 1;
`

const StyledIconButton = styled(IconButton)`
  color: #0d79d0;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  width: auto;
  &:disabled {
    color: #c9c9c9 !important;
    background-color: unset !important;
    border: unset;
  }
  svg {
    margin-right: 4px;
  }
`

export interface AuthorActionsProps {
  onSave: () => void
  onDelete: () => void
  showDeleteDialog: boolean
  handleShowDeleteDialog: () => void
  newAuthor: boolean
  isDisableSave: boolean
}

export const AuthorActions: React.FC<AuthorActionsProps> = ({
  onSave,
  onDelete,
  showDeleteDialog,
  handleShowDeleteDialog,
  newAuthor,
  isDisableSave,
}) => {
  return (
    <AuthorActionsContainer data-cy="author-action">
      <DeleteAuthorConfirmationDialog
        isOpen={showDeleteDialog}
        onDelete={() => {
          handleShowDeleteDialog()
          onDelete()
        }}
        onCancel={() => handleShowDeleteDialog()}
      />
      <StyledButtonGroup>
        <StyledIconButton
          onClick={onSave}
          disabled={isDisableSave}
          type="submit"
        >
          <PlusIcon />
          {newAuthor ? 'Save Details' : 'Update Details'}
        </StyledIconButton>
      </StyledButtonGroup>
    </AuthorActionsContainer>
  )
}
