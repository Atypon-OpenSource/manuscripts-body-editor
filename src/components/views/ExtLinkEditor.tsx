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
  CloseButton,
  DeleteIcon,
  IconButton,
  IconTextButton,
  LinkIcon,
} from '@manuscripts/style-guide'
import React, { useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { FileManagement } from '../../lib/files'
import { DragAndDropUploader } from '../DragAndDropUploader'
export interface ExtLinkEditorProps {
  id: string
  extLink: string
  onUpdate: (attrs: { extLink: string }) => void
  editorProps: EditorProps
}

export const ExtLinkEditor: React.FC<ExtLinkEditorProps> = ({
  id,
  extLink,
  onUpdate,
  editorProps,
}) => {
  const [isEditing, setIsEditing] = useState(false)

  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileManagement = editorProps.fileManagement as FileManagement

  const handleFileUpload = async (file: File) => {
    const result = await fileManagement.upload(file)
    console.log('++++++++++++++++++ File upload result:')
    console.log(result)

    setUploadError(null)
    setIsEditing(false)
    // Simulated URL — replace with real file upload logic
    const fakeUploadedUrl = URL.createObjectURL(file)
    onUpdate({ extLink: fakeUploadedUrl })
  }

  const handleUploadError = (message: string) => {
    setUploadError(message)
  }

  const handleRemove = () => {
    setUploadError(null)
    onUpdate({ extLink: '' })
    setIsEditing(false)
  }

  return (
    <ThemeProvider theme={editorProps.theme}>
      {!isEditing && !extLink && (
        <IconTextButton onClick={() => setIsEditing(true)}>
          <LinkIcon />
          Add Link
        </IconTextButton>
      )}

      {isEditing && (
        <ExtLinkEditorContainer>
          <DragAndDropUploader
            upload={handleFileUpload}
            onUploadError={handleUploadError}
            allowedFileTypes={[
              'application/pdf',
              'image/png',
              'image/jpeg',
              'image/tiff',
            ]}
            maxFileSizeMB={10}
          />
          <CloseUploaderButton
            onClick={() => setIsEditing(false)}
          ></CloseUploaderButton>
        </ExtLinkEditorContainer>
      )}

      {extLink && (
        <LinkedFileInfoBox>
          <p>
            <LinkIcon />
            {extLink}
          </p>
          <IconButton onClick={handleRemove}>
            <DeleteIcon />
          </IconButton>
          {/* <button onClick={handleRemove}>Remove</button> */}
        </LinkedFileInfoBox>
      )}

      {uploadError && (
        <div>
          <p className="font-semibold">Error:</p>
          <p>{uploadError}</p>
        </div>
      )}
    </ThemeProvider>
  )
}
const ExtLinkEditorContainer = styled.div`
  position: relative;
`

const LinkedFileInfoBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: ${(props) => props.theme.colors.background.secondary};
  color: ${(props) => props.theme.colors.text.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: 8px;

  p {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;

    font-family: ${(props) => props.theme.font.family.sans};
    font-weight: ${(props) => props.theme.font.weight.normal};
    font-size: ${(props) => props.theme.font.size.medium};
  }
`

const CloseUploaderButton = styled(CloseButton)<{ size?: number }>`
  border: 1px solid ${(props) => props.theme.colors.border.tertiary};
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.12);

  position: absolute;
  top: -8px;
  right: -8px;
`
