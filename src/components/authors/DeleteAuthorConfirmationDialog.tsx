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
import { AttentionOrangeIcon, Category, Dialog } from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

const StyledIcon = styled(AttentionOrangeIcon)`
  margin-right: 8px;
`

const P = styled.p`
  margin-bottom: 4px;
`

const Header = () => (
  <>
    <StyledIcon /> Delete author
  </>
)

const Message = () => {
  return (
    <>
      <p>Are you sure you want to remove this author from the authors list?</p>
      <P>Do you want to continue?</P>
    </>
  )
}
export interface DeleteAuthorConfirmationDialogProps {
  isOpen: boolean
  onDelete: () => void
  onCancel: () => void
}

export const DeleteAuthorConfirmationDialog: React.FC<
  DeleteAuthorConfirmationDialogProps
> = ({ isOpen, onDelete, onCancel }) => {
  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header={<Header />}
      message={<Message />}
      actions={{
        secondary: {
          action: onDelete,
          title: 'Delete',
        },
        primary: {
          action: onCancel,
          title: 'Cancel',
        },
      }}
    />
  )
}
