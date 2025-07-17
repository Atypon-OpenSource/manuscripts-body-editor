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
import React, {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  useRef,
  useState,
} from 'react'
import styled from 'styled-components'

interface DragAndDropUploaderProps {
  upload: (file: File) => Promise<void>
  onUploadError: (message: string) => void
  allowedFileTypes?: string[] // Optional: e.g., ['image/jpeg', 'image/png']
  maxFileSizeMB?: number // Optional: e.g., 5 for 5MB
}

export const DragAndDropUploader: React.FC<DragAndDropUploaderProps> = ({
  upload,
  onUploadError,
  allowedFileTypes,
  maxFileSizeMB,
}) => {
  // State to track if a file is currently being dragged over the drop zone
  // const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false)

  // Ref to the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    if (!file) {
      onUploadError('No file selected.')
      return false
    }

    // validate file type if allowedFileTypes are provided
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      if (!allowedFileTypes.includes(file.type)) {
        onUploadError(
          `Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}`
        )
        return false
      }
    }

    // validate file size if maxFileSizeMB is provided
    if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
      onUploadError(`File size exceeds limit of ${maxFileSizeMB} MB.`)
      return false
    }

    return true
  }

  const processFiles = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        try {
          setIsUploading(true)
          await upload(file)
        } catch (error) {
          onUploadError('Upload failed. Please try again.')
          console.error('Upload error:', error)
        } finally {
          setIsUploading(false)
        }
      }
    } else {
      onUploadError('No file selected or dropped.')
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer && e.dataTransfer.items) {
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }
      }
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    await processFiles(e.dataTransfer.files)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files)
  }

  const handleAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.dataset && target.dataset.action) {
      return
    }
    fileInputRef.current?.click() // Programmatically click the hidden input
  }

  return (
    <DragAndDropContainer
      onDragOver={handleDragOver}
      onDrop={!isUploading ? handleDrop : undefined}
      onClick={!isUploading ? handleAreaClick : undefined}
      tabIndex={isUploading ? -1 : 0}
      aria-label="Drag and drop area for file upload, or click to open file dialog."
      role="button"
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        aria-hidden="true"
      />
      <p>
        Drag or click here to upload a file to link
        <br />
        or drag items here from the file{' '}
        <span data-action="open-other-files">&apos;Other files&apos;</span> in
        the inspector.
      </p>
    </DragAndDropContainer>
  )
}

const DragAndDropContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: 8px;
  background-color: ${(props) => props.theme.colors.background.secondary};
  color: ${(props) => props.theme.colors.text.primary};
  font-size: ${(props) => props.theme.font.size.normal};

  input[type='file'] {
    display: none;
  }

  p {
    margin: 0;
    font-size: 14px;
    text-align: center;
  }
  span {
    text-decoration: underline;
    cursor: pointer;
  }
`
