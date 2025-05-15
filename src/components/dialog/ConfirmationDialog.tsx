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

export enum DialogType {
  SAVE = 'save',
  DELETE = 'delete',
  REQUIRED = 'required',
  INVALID = 'invalid',
}

const getDialogConfig = (
  dialogType: DialogType,
  entityType: string,
  fieldName?: string
) => {
  const configs = {
    [DialogType.SAVE]: {
      title: 'Unsaved changes',
      message: {
        primary: "You've made changes but not saved them!",
        secondary: 'Would you like to save or discard your changes?',
      },
      buttons: {
        primary: 'Save',
        secondary: 'Discard',
      },
    },
    [DialogType.DELETE]: {
      title: `Delete ${entityType}`,
      message: {
        primary:
          entityType === 'affiliation'
            ? 'This action will delete the institution and any links to authors affiliated to it.'
            : `Are you sure you want to remove this ${entityType} from the list?`,
        secondary: 'Do you want to continue?',
      },
      buttons: {
        primary: 'Delete',
        secondary: 'Cancel',
      },
    },
    [DialogType.REQUIRED]: {
      title: 'Empty required field',
      message: {
        primary:
          'A required field has been left empty. If you discard, any updates will not be saved!',
        secondary: 'Would you like to discard or continue editing?',
      },
      buttons: {
        primary: 'Continue editing',
        secondary: 'Discard',
      },
      minHeight: '90px',
    },
    [DialogType.INVALID]: {
      title: 'Invalid field value',
      message: {
        primary: `The ${
          fieldName || 'field'
        } is not in a valid format. If you discard, any updates will not be saved!`,
        secondary: 'Would you like to discard or continue editing?',
      },
      buttons: {
        primary: 'Continue editing',
        secondary: 'Discard',
      },
      minHeight: '90px',
    },
  }

  return configs[dialogType]
}

interface ConfirmationDialogProps {
  isOpen: boolean
  type: DialogType
  entityType: string
  onPrimary: () => void
  onSecondary: () => void
  fieldName?: string // New optional prop for invalid field name
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  type,
  entityType,
  onPrimary,
  onSecondary,
  fieldName,
}) => {
  const config = getDialogConfig(type, entityType, fieldName)

  const Header = () => (
    <>
      <StyledIcon /> {config.title}
    </>
  )

  const Message = () => (
    <MessageBox>
      <div>{config.message.primary}</div>
      {config.message.secondary && <div>{config.message.secondary}</div>}
    </MessageBox>
  )

  return (
    <Dialog
      isOpen={isOpen}
      category={Category.confirmation}
      header={<Header />}
      message={<Message />}
      actions={{
        primary: {
          action: onPrimary,
          title: config.buttons.primary,
        },
        secondary: {
          action: onSecondary,
          title: config.buttons.secondary,
        },
      }}
    />
  )
}
