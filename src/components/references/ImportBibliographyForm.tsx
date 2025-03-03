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

import * as Citation from '@citation-js/core'
import '@citation-js/plugin-bibtex'
import '@citation-js/plugin-ris'
import '@citation-js/plugin-doi'
import '@citation-js/plugin-csl'
import '@citation-js/plugin-pubmed'
import '@citation-js/plugin-enw'


import {
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from '@manuscripts/style-guide'
import { Field, FieldProps, Formik, FormikProps } from 'formik'
import React, { DragEvent, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { ChangeHandlingForm } from '../ChangeHandlingForm'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import { debounce } from 'lodash'

export type ImportBibAttrs = {
  fileContent: string
  citation?: string
  data: BibliographyItemAttrs[]
}
export interface ImportBibFormProps {
  onCancel: () => void
  onChange: (values: ImportBibAttrs) => void
  onSave: (values: ImportBibAttrs) => void
}

export const ImportBibliographyForm = ({
  onCancel,
  onChange,
  onSave,
}: ImportBibFormProps) => {
  const formRef = useRef<FormikProps<ImportBibAttrs>>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false);

  const updateFileContent =
    (setFieldValue: FormikProps<ImportBibAttrs>['setFieldValue']) =>
    async (file: File) => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (event.target?.result) {
          const content = event.target.result as string
          setFieldValue('fileContent', content.trim())
          await handleGenerateCitation(content, setFieldValue) // Auto-generate preview
        }
      }
      reader.readAsText(file)
    }

  const handleFileChange =
    (setFieldValue: FormikProps<ImportBibAttrs>['setFieldValue']) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        updateFileContent(setFieldValue)(file)
        event.target.value = '' // Reset input
      }
    }

  const handleDrop =
    (setFieldValue: FormikProps<ImportBibAttrs>['setFieldValue']) =>
    (event: DragEvent<HTMLDivElement>) => {
      setDragging(false);
      event.preventDefault()
      if (event.dataTransfer.files.length > 0) {
        updateFileContent(setFieldValue)(event.dataTransfer.files[0])
      }
    }

  const handleGenerateCitation = async (
    fileContent: string,
    setFieldValue: FormikProps<ImportBibAttrs>['setFieldValue']
  ) => {
    const NO_CITATION = 'No citation available'
    const ERROR_CITATION = 'Error generating citation'
    try {
      if (!fileContent.trim()) {
        setFieldValue('citation', NO_CITATION)
        setFieldValue('data', [])
        return
      }
      const cite = await Citation.Cite.async(fileContent.trim())
      const formattedCitation = cite.format('bibliography', { format: 'html' })
      setFieldValue('citation', cite.data.length ? formattedCitation: NO_CITATION)
      setFieldValue('data', cite.data.length ? cite.data: [])
    } catch (error) {
      console.error('Citation generation error:', error)
      setFieldValue('citation', ERROR_CITATION)
      setFieldValue('data', [])
    }
  }

  const handleCancel = () => {
    formRef.current?.resetForm()
    onCancel()
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  // Debounced function
  const debouncedHandleGenerateCitation = debounce(
    (fileContent, setFieldValue) => {
      handleGenerateCitation(fileContent, setFieldValue)
    },
    500 // Adjust debounce time (e.g., 500ms)
  )

  return (
    <Formik<ImportBibAttrs>
      initialValues={{ fileContent: '', citation: '', data: [] }}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values)
        setSubmitting(false)
      }}
      enableReinitialize
      validateOnChange={false}
      innerRef={formRef}
    >
      {(formik) => {
        useEffect(() => {
          if (formik.values.fileContent.trim()) {
            debouncedHandleGenerateCitation(formik.values.fileContent, formik.setFieldValue)
          }
        }, [formik.values.fileContent])

        return (
          <ChangeHandlingForm onChange={onChange}>
            <DropContainer
              onDrop={handleDrop(formik.setFieldValue)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              active={dragging}
            >
              <InputFile
                id="fileInput"
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange(formik.setFieldValue)}
              />
              <label
                htmlFor="fileInput"
              >
                Drag & Drop a file here or click to import data from file
              </label>
            </DropContainer>

            <LabelContainer>
              <Label>Or copy&paste here</Label>
            </LabelContainer>
            <Field name="fileContent">
              {({ field }: FieldProps) => (
                <TextArea
                  rows={4}
                  id="fileContent"
                  {...field}
                  className="TextArea"
                />
              )}
            </Field>
            <LabelContainer>
              <Label>Preview</Label>
            </LabelContainer>
            <Preview
              dangerouslySetInnerHTML={{
                __html: formik.values.citation || 'No preview...',
              }}
            />

            <ButtonContainer>
              <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
              <SecondaryButton
                onClick={() =>
                  handleGenerateCitation(
                    formik.values.fileContent,
                    formik.setFieldValue
                  )
                }
                disabled={!formik.values.fileContent.trim()} // Disable if empty
              >
                Preview
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={!formik.dirty || formik.isSubmitting || !formik.values.data.length}
              >
                Save
              </PrimaryButton>
            </ButtonContainer>
          </ChangeHandlingForm>
        )}
      }
    </Formik>
  )
}
const Preview = styled.div`
  min-height: 50px;
  border-radius: 4px;
  background: ${(props) => props.theme.colors.background.primary};
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.medium};
  color: ${(props) => props.theme.colors.text.primary};

  & * {
    margin: 0;
    padding: 0;
    line-height: 1.5;
  }
`
const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => 4 * props.theme.grid.unit}px;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

const Label = styled.label`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.large};
  display: block;
  color: ${(props) => props.theme.colors.text.secondary};
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  gap: 8px;
`

const InputFile = styled.input`
  display: none;
`

const activeBoxStyle = css`
  background: #f2fbfc;
  border: 1px dashed #bce7f6;
`

const DropContainer = styled.div<{ active: boolean }>`
  background: ${(props) => props.theme.colors.background.secondary};
  border: 1px dashed #e2e2e2;
  box-sizing: border-box;
  border-radius: 8px;
  cursor: pointer;
  ${(props) =>
    props.active
      ? css`
          ${activeBoxStyle}
        `
      : css``}
  & label {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 24px;
    font-family: ${(props) => props.theme.font.family.Lato};
    color: ${(props) => props.theme.colors.text.onLight};
  }
`
