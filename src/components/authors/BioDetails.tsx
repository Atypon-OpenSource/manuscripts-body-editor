/*!
 * © 2026 Atypon Systems LLC
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
  FormRow,
  InputErrorText,
  InputHelperText,
  Label,
  SecondaryButton,
  TextAreaWithCounter,
} from '@manuscripts/style-guide'
import { Avatar } from '@manuscripts/style-guide/mui'
import { FormikProvider, useFormik } from 'formik'
import React, { KeyboardEvent, MutableRefObject, useRef, useState } from 'react'
import styled from 'styled-components'

import { BIO_TEXT_MAX_LENGTH, BioValues } from '../../lib/bio'
import { FileAttachment, FileManagement } from '../../lib/files'
import { ChangeHandlingForm } from '../ChangeHandlingForm'
import { UnsavedLabel } from '../form/UnsavedLabel'
import { DropContainer } from '../references/ImportBibliographyForm'
import { FormActions } from './AuthorDetailsForm'

const IMAGE_TYPES = ['image/jpeg', 'image/png']
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const IMAGE_SIZE = 80

export interface BioDetailsProps {
  values: BioValues
  onChange: (values: BioValues) => void
  onSave: (values: BioValues) => void
  actionsRef?: MutableRefObject<FormActions | undefined>
  fileManagement: FileManagement
  getFiles: () => FileAttachment[]
  canUpload: boolean
  canDetach: boolean
  unsavedContinueActive?: boolean
}

export const BioDetails: React.FC<BioDetailsProps> = ({
  values,
  onChange,
  onSave,
  actionsRef,
  fileManagement,
  getFiles,
  canUpload,
  canDetach,
  unsavedContinueActive = false,
}) => {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  // the uploaded file may not be in the list of the files yet
  const [uploaded, setUploaded] = useState<FileAttachment>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formik = useFormik<BioValues>({
    initialValues: values,
    onSubmit: (submitted) => onSave(submitted),
    enableReinitialize: true,
  })

  if (actionsRef) {
    actionsRef.current = {
      reset: () => formik.resetForm(),
      submitForm: () => formik.submitForm(),
    }
  }

  const upload = async (file: File) => {
    if (uploading) {
      return
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Please upload a JPG or PNG image.')
      return
    }
    if (file.size > IMAGE_MAX_SIZE) {
      setError('Please upload an image that is not larger than 2MB.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await fileManagement.upload(file)
      if (result) {
        setUploaded(result)
        formik.setFieldValue('image', result.id)
      }
    } catch (e) {
      console.error('Bio image upload error:', e)
      setError('The image could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      upload(file)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      upload(file)
    }
    // allows to select the same file again
    event.target.value = ''
  }

  const handleOnKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef?.current?.click()
    }
  }

  const showUnsavedDot = (key: keyof BioValues) =>
    unsavedContinueActive && formik.values[key] !== formik.initialValues[key]

  const image = formik.values.image
  const file =
    uploaded?.id === image ? uploaded : getFiles().find((f) => f.id === image)
  const link = file && fileManagement.previewLink(file)

  return (
    <FormikProvider value={formik}>
      <ChangeHandlingForm<BioValues>
        onChange={onChange}
        id="author-bio-form"
        noValidate
      >
        {(image || canUpload) && (
          <FormRow>
            <UnsavedLabel htmlFor="bio-image" showDot={showUnsavedDot('image')}>
              Bio Image
            </UnsavedLabel>
            {image ? (
              <ImageContainer data-cy="bio-image">
                <Avatar size={IMAGE_SIZE} src={link} alt="Bio image" />
                {canDetach && (
                  <SecondaryButton
                    type="button"
                    data-cy="bio-image-remove"
                    onClick={() => formik.setFieldValue('image', '')}
                  >
                    Remove Image
                  </SecondaryButton>
                )}
              </ImageContainer>
            ) : (
              <ImageDropContainer
                tabIndex={0}
                role="button"
                data-cy="bio-image-upload"
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onKeyDown={handleOnKeyDown}
                $active={dragging}
              >
                <input
                  id="bio-image"
                  name="bio-image"
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <Label htmlFor="bio-image">
                  {uploading ? (
                    <span>Uploading…</span>
                  ) : (
                    <span>
                      Drag or <ClickHere>click here</ClickHere> to upload a
                      photo
                    </span>
                  )}
                  <InputHelperText>JPG or PNG, max 2MB</InputHelperText>
                </Label>
              </ImageDropContainer>
            )}
            {error && <InputErrorText>{error}</InputErrorText>}
          </FormRow>
        )}
        <FormRow>
          <UnsavedLabel htmlFor="bio-text" showDot={showUnsavedDot('text')}>
            Biography
          </UnsavedLabel>
          <TextAreaWithCounter
            id="bio-text"
            name="text"
            rows={8}
            maxLength={BIO_TEXT_MAX_LENGTH}
            placeholder="Enter brief biographical statement (plain text only)..."
            value={formik.values.text}
            onChange={formik.handleChange}
          />
        </FormRow>
      </ChangeHandlingForm>
    </FormikProvider>
  )
}

const ImageDropContainer = styled(DropContainer)`
  & label {
    height: 120px;
    flex-direction: column;
    gap: ${(props) => props.theme.grid.unit}px;
  }
`

const ClickHere = styled.span`
  text-decoration: underline;
`

const ImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${(props) => props.theme.grid.unit * 2}px;
  padding: ${(props) => props.theme.grid.unit * 4}px;
  background: ${(props) => props.theme.colors.background.secondary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.grid.radius.default};
`
