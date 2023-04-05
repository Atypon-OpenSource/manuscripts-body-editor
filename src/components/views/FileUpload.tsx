/*!
 * © 2022 Atypon Systems LLC
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
import { SubmissionAttachment } from '@manuscripts/style-guide'
import React, { ChangeEvent, useCallback } from 'react'

export interface FileUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  accept: string
  relation: string
  uploadAttachment: (
    file: File
  ) => Promise<{ data?: { uploadAttachment?: SubmissionAttachment } }>
  addFigureExFileRef: (
    relation: string,
    publicUrl: string,
    attachmentId: string
  ) => void
}

export const FileUpload: React.FC<FileUploadProps> = ({
  fileInputRef,
  relation,
  accept,
  uploadAttachment,
  addFigureExFileRef,
}) => {
  const resetUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [fileInputRef])

  const onFileInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0]
      if (file) {
        const response = await uploadAttachment(file)
        if (response?.data?.uploadAttachment) {
          // eslint-disable-next-line no-unsafe-optional-chaining
          const { link, id } = response.data?.uploadAttachment
          addFigureExFileRef(relation, link, id)
        }
        resetUpload()
      }
    },
    [uploadAttachment, resetUpload, addFigureExFileRef, relation]
  )

  return (
    <input
      type="file"
      style={{ display: 'none' }}
      accept={accept}
      onChange={onFileInputChange}
      value={''}
      ref={fileInputRef}
    />
  )
}
