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
import { ManuscriptNode } from '@manuscripts/transform'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'
import styled from 'styled-components'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { FileManagement } from '../../lib/files'
import { DragAndDropUploader } from '../DragAndDropUploader'
export interface ExtLinkEditorProps {
  node: ManuscriptNode
  nodePos: number
  view: EditorView
  editorProps: EditorProps
  isEditing: boolean
  setIsEditing: (val: boolean) => void
}

export const ExtLinkEditor: React.FC<ExtLinkEditorProps> = ({
  node,
  nodePos,
  view,
  editorProps,
  isEditing,
  setIsEditing,
}) => {
  // const [isEditing, setIsEditing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileManagement = editorProps.fileManagement as FileManagement

  const extLink = node.attrs.extLink
  const files = editorProps.getFiles()
  const file = extLink ? files.find((f) => f.id === extLink) : undefined

  const onUpdate = (newAttrs: { extLink: string }) => {
    const tr = view.state.tr.setNodeMarkup(nodePos, undefined, {
      ...node.attrs,
      ...newAttrs,
    })
    view.dispatch(tr)
  }

  const handleFileUpload = async (file: File) => {
    setUploadError(null)
    const result = await fileManagement.upload(file)
    if (!result) {
      handleUploadError('File upload failed')
      return
    }
    setIsEditing(false)
    onUpdate({ extLink: result.id })
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
    <div>
      {!isEditing && !extLink && (
        <IconTextButton
          onClick={() => setIsEditing(true)}
          aria-label="Add linked file"
        >
          <LinkIcon />
          Add link
        </IconTextButton>
      )}

      {isEditing && !extLink && (
        <div>
          <ExtLinkEditorLabel>Link</ExtLinkEditorLabel>
          <ExtLinkEditorContainer>
            <DragAndDropUploader
              upload={handleFileUpload}
              onUploadError={handleUploadError}
            />
            <CloseUploaderButton
              onClick={() => setIsEditing(false)}
            ></CloseUploaderButton>
          </ExtLinkEditorContainer>
        </div>
      )}

      {extLink && (
        <LinkedFileInfoBox>
          <p>
            <LinkIcon />
            {file ? file.name : 'File does not exist.'}
          </p>
          <IconButton onClick={handleRemove} aria-label="Remove linked file">
            <DeleteIcon />
          </IconButton>
        </LinkedFileInfoBox>
      )}

      {uploadError && (
        <div>
          <p className="font-semibold">Error:</p>
          <p>{uploadError}</p>
        </div>
      )}
    </div>
  )
}
const ExtLinkEditorLabel = styled.div`
  color: var(--label-color);
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.369px;
  margin-top: 12px;
  cursor: pointer;
`

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
