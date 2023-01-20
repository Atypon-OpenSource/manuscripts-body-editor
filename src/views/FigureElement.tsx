/*!
 * © 2019 Atypon Systems LLC
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
// PLEASE NOTE: React views for the editor nodes are depercated. This is kept for historical purposes and possible (but not likely) change of direction on the project

import {
  AttachIcon,
  Designation,
  DropdownContainer,
  getDesignationName,
  RoundIconButton,
  SelectDialogDesignation,
  SubmissionAttachment,
  useDropdown,
} from '@manuscripts/style-guide'
import { FigureNode } from '@manuscripts/transform'
import { Node } from 'prosemirror-model'
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  useFigureSelection,
  useFileInputRef,
} from '../components/hooks/figure-upload'
import { FilesDropdown } from '../components/views/FilesDropdown'
import { FileUpload } from '../components/views/FileUpload'
import { getAllowedForInFigure } from '../lib/external-files'
import { getFileExtension } from '../lib/utils'
import EditableBlock from './EditableBlock'
import { FigureProps } from './FigureComponent'
import { ReactViewComponentProps } from './ReactView'

interface AttachableFilesDropdownProps {
  onSelect: (file: SubmissionAttachment) => void
  files: SubmissionAttachment[]
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  addFigureExFileRef: (attachmentId: string) => void
}

export const AttachableFilesDropdown: React.FC<
  AttachableFilesDropdownProps
> = ({ onSelect, files, uploadAttachment, addFigureExFileRef }) => {
  // select and browse local selectio
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
  const allowedFiles = useMemo(() => getAllowedForInFigure(files), [files])
  const [isOpenDesignationSelector, toggleDesignationSelector] =
    useState<boolean>(false)

  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [uploadedFileDesignation, setUploadedFileDesignation] =
    useState<string>('')
  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e && e.target && e.target.files ? e.target.files[0] : ''
    if (file) {
      setFileToUpload(file)
      toggleDesignationSelector(true)
    }
  }

  const addNewFile = () => {
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const resetUploadProcess = () => {
    toggleDesignationSelector(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <DropdownWrapper ref={wrapperRef}>
      <RoundIconButton
        className={isOpen ? 'active' : ''}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleOpen(e)
        }}
      >
        <AttachIcon />
      </RoundIconButton>
      {isOpen && (
        <DropdownContainer>
          {allowedFiles &&
            allowedFiles.map((file, i) => (
              <DropdownItem key={i} onClick={() => onSelect(file)}>
                {file.name}
              </DropdownItem>
            ))}
          <DropdownItem onClick={() => addNewFile()}>Add file...</DropdownItem>
        </DropdownContainer>
      )}
      <input
        type="file"
        style={{ display: 'none' }}
        onChange={onFileInputChange}
        value={''}
        ref={fileInputRef}
      />
      {fileToUpload && (
        <SelectDialogDesignation
          isOpen={isOpenDesignationSelector}
          fileExtension={getFileExtension(fileToUpload)}
          fileSection={[Designation.Dataset, Designation.Figure]}
          handleCancel={resetUploadProcess}
          uploadFileHandler={() => {
            if (uploadedFileDesignation) {
              uploadAttachment(uploadedFileDesignation, fileToUpload)
                .then((result) => {
                  if (result?.data?.uploadAttachment) {
                    const { link } = result.data.uploadAttachment
                    addFigureExFileRef(link)
                    // having the name and the link - add either image represnation or a dataset for the current figure
                  }
                  resetUploadProcess()
                  return
                })
                .catch((e) => console.log(e))
            }
          }}
          // @ts-ignore: Defined as any in the style-guide
          dispatch={({ designation }) => {
            setUploadedFileDesignation(getDesignationName(designation))
          }}
        />
      )}
    </DropdownWrapper>
  )
}

export const isTableNode = (node: Node) =>
  node.type === node.type.schema.nodes.table
export const isFigureNode = (node: Node) =>
  node.type === node.type.schema.nodes.figure

const FigureElement = ({
  modelMap,
  uploadAttachment,
  getAttachments,
  capabilities: can,
  mediaAlternativesEnabled,
}: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    contentDOM,
    viewProps,
  }) => {
    const content = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (content && content.current) {
        content.current.appendChild(
          contentDOM || document.createElement('figure')
        )
      }
    }, [contentDOM])

    useEffect(() => {
      const { suppressCaption, suppressTitle } = viewProps.node.attrs
      if (content.current) {
        content.current.classList.toggle('suppress-caption', suppressCaption)
        content.current.classList.toggle(
          'suppress-title',
          suppressTitle === undefined ? true : suppressTitle
        )
      }
    }, [viewProps.node.attrs])

    const { fileInputRef, onUploadClick } = useFileInputRef()

    const { addFigureExFileRef } = useFigureSelection(viewProps)

    return (
      <EditableBlock canWrite={!!can?.editArticle} viewProps={viewProps}>
        <FigureWrapper contentEditable="false">
          <FileUpload
            fileInputRef={fileInputRef}
            uploadAttachment={uploadAttachment}
            addFigureExFileRef={addFigureExFileRef}
            designation={'figure'}
            accept={'image/*'}
            relation={'imageRepresentation'}
          />

          <FilesDropdown
            getAttachments={getAttachments}
            modelMap={modelMap}
            onUploadClick={onUploadClick}
            mediaAlternativesEnabled={mediaAlternativesEnabled}
            addFigureExFileRef={addFigureExFileRef}
            canReplaceFile={can?.replaceFile}
            canUploadFile={can?.uploadFile}
          />

          <div contentEditable="true" ref={content}></div>
        </FigureWrapper>
      </EditableBlock>
    )
  }

  return Component
}

export const AlternativesList = styled.div`
  padding: 1rem;
`

export const FigureWrapper = styled.div`
  border: 1px solid #f2f2f2;
  border-radius: 4px;
  padding: 0.5rem;
  position: relative;
`

export const DropdownWrapper = styled.div`
  position: relative;
`

export const DropdownItem = styled.div`
  padding: 0.5em;
`

export default FigureElement
