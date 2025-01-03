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

const MessageBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 90px;
`

const Header = () => (
  <>
    <StyledIcon /> Empty required field
  </>
)

const Message = () => {
  return (
    <MessageBox>
      <div>
        A required filed has been left empty. If you discard, any updates will
        not be saved!
      </div>
      <div>Would you like to discard or continue editing?</div>
    </MessageBox>
  )
}
export interface SaveAuthorConfirmationDialogProps {
  isOpen: boolean
  onSave: () => void
  onCancel: () => void
}

export const RequiredFieldConfirmationDialog: React.FC<
  SaveAuthorConfirmationDialogProps
> = ({ isOpen, onSave, onCancel }) => {
  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header={<Header />}
      message={<Message />}
      actions={{
        secondary: {
          action: onCancel,
          title: 'Discard',
        },
        primary: {
          action: onSave,
          title: 'Continue editing',
        },
      }}
    />
  )
}
