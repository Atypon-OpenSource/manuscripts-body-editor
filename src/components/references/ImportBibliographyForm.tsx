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
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import { useFormik } from 'formik'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'

import { importBibliographyItems } from '../../lib/references'
import { ReferenceLine } from './ReferenceLine'

export interface ImportBibFormProps {
  onCancel: () => void
  onSave: (data: BibliographyItemAttrs[]) => void
}

export const ImportBibliographyForm = ({
  onCancel,
  onSave,
}: ImportBibFormProps) => {
  const [dragging, setDragging] = useState(false)

  const formik = useFormik({
    initialValues: {
      content: '',
      err: '',
      data: [],
    },
    onSubmit: (values, { setSubmitting }) => {
      onSave(values.data)
      setSubmitting(false)
    },
    onReset: onCancel,
  })

  const setDataField = useCallback(async (fileContent: string) => {
    const NO_CITATION = 'No citation available'
    const ERROR_CITATION = 'Error generating citation'
    try {
      if (!fileContent.trim()) {
        await formik.setFieldValue('err', NO_CITATION)
        await formik.setFieldValue('data', [])
        return
      }
      const data = await importBibliographyItems(fileContent.trim())
      await formik.setFieldValue('data', data ? data : [])
      await formik.setFieldValue('err', '')
    } catch (error) {
      console.error('Citation generation error:', error)
      await formik.setFieldValue('err', ERROR_CITATION)
      await formik.setFieldValue('data', [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const debouncedGenerateData = useMemo(
    () => debounce(setDataField, 300),
    [setDataField]
  )

  useEffect(() => {
    debouncedGenerateData(formik.values.content)
  }, [debouncedGenerateData, formik.values.content])

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      readFileContent(file)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      readFileContent(file)
    }
  }

  const readFileContent = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        formik.setFieldValue('content', e.target.result)
      }
    }
    reader.readAsText(file)
  }

  return (
    <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
      <DropContainer
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        active={dragging}
      >
        <input
          id="file"
          name="file"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <Label htmlFor="file">
          Drag & Drop or Click here to upload a file.
        </Label>
      </DropContainer>

      <LabelContainer>
        <Label>
          Alternatively, you can directly Copy&Paste below, the text of the
          bibliography items.
        </Label>
      </LabelContainer>
      <TextArea
        name="content"
        rows={6}
        value={formik.values.content}
        onChange={formik.handleChange}
      ></TextArea>

      <Preview>
        {formik.values.err}
        {formik.values.data.map((item: BibliographyItemAttrs) => (
          <ReferenceLine item={item} key={item.id} />
        ))}
      </Preview>
      <ButtonContainer>
        <SecondaryButton type="reset">Cancel</SecondaryButton>
        <PrimaryButton
          type="submit"
          disabled={
            !formik.dirty || formik.isSubmitting || !formik.values.data.length
          }
        >
          Save
        </PrimaryButton>
      </ButtonContainer>
    </form>
  )
}

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => 4 * props.theme.grid.unit}px;
  min-height: 50px;
  margin-top: ${(props) => 4 * props.theme.grid.unit}px;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`
const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => 4 * props.theme.grid.unit}px;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

const Label = styled.label`
  font-size: ${(props) => props.theme.font.size.normal};
  line-height: ${(props) => props.theme.font.lineHeight.large};
  font-family: ${(props) => props.theme.font.family.Lato};
  display: block;
  color: ${(props) => props.theme.colors.text.secondary};
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${(props) => 4 * props.theme.grid.unit}px;
  gap: ${(props) => 2 * props.theme.grid.unit}px;
`

const activeBoxStyle = css`
  background: #f2fbfc;
  border: 1px dashed #bce7f6;
`

const DropContainer = styled.div<{ active: boolean }>`
  background: ${(props) => props.theme.colors.background.secondary};
  border: 1px dashed ${(props) => props.theme.colors.border.secondary};
  box-sizing: border-box;
  border-radius: ${(props) => props.theme.grid.radius.default};
  cursor: pointer;
  ${({ active }) => active && activeBoxStyle};

  &:hover {
    ${activeBoxStyle}
  }

  & label {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: ${(props) => props.theme.font.size.normal};
    line-height: ${(props) => props.theme.font.lineHeight.large};
    font-family: ${(props) => props.theme.font.family.Lato};
    color: ${(props) => props.theme.colors.text.onLight};
  }
`
