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
import {
  ButtonGroup,
  DeleteIcon,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ContributorAttrs } from '../../lib/authors'
import { DeleteAuthorConfirmationDialog } from './DeleteAuthorConfirmationDialog'

const AuthorActionsContainer = styled.div`
  display: flex;
`

const RemoveButton = styled.div`
  display: flex;
  align-items: center;

  svg {
    cursor: pointer;
  }
`

const StyledButtonGroup = styled(ButtonGroup)`
  flex: 1;
`

export interface AuthorActionsProps {
  author: ContributorAttrs
  onSave: () => void
  onDelete: () => void
  onCancel: () => void
}

export const AuthorActions: React.FC<AuthorActionsProps> = ({
  author,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <AuthorActionsContainer>
      <DeleteAuthorConfirmationDialog
        author={author}
        isOpen={showDeleteDialog}
        onDelete={() => {
          setShowDeleteDialog(true)
          onDelete()
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
      <RemoveButton onClick={() => setShowDeleteDialog(true)}>
        <DeleteIcon />
      </RemoveButton>
      <StyledButtonGroup>
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton onClick={onSave}>Save</PrimaryButton>
      </StyledButtonGroup>
    </AuthorActionsContainer>
  )
}
