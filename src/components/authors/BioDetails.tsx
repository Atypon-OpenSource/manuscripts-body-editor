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


import { FormRow, Label, TextArea } from "@manuscripts/style-guide";
import React, { KeyboardEvent, useRef, useState } from "react";
import { DropContainer } from "../references/ImportBibliographyForm";
import { useFormik } from "formik";

// upload = async (file: File) => {
//     const result = await this.props.fileManagement.upload(file)
//     this.setSrc(result.id)
//   }

interface BioDetailsProps {
    upload: (file: File) => Promise<string>
}

export const BioDetails: React.FC<BioDetailsProps> = ({ upload }) => {

    const [dragging, setDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
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
          setFile
        }
      }

    const handleOnKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          fileInputRef?.current?.click()
        }
      }

    const formik = useFormik({
        initialValues: {
          content: '',
          err: '',
          data: [],
        },
        onSubmit: async (values, { setSubmitting }) => {
            await upload(file)
          await onSave(values.data)
          
          setSubmitting(false)
        },
        onReset: onCancel,
      })


    return (
        <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
        <Label>Bio Image</Label>
        <FormRow>
            <DropContainer
            tabIndex={0}
            role="button"
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
                id="file"
                name="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <Label htmlFor="file">
                Drag & Drop or Click here to upload a file.
            </Label>
            </DropContainer>
        </FormRow>
    
    <Label>Biography</Label>
    <TextArea>
    </TextArea>
    </form>
    )
}

