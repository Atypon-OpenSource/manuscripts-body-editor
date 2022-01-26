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

import AttachIcon from '@manuscripts/assets/react/AttachIcon'
import {
  FigureNode,
  ManuscriptEditorView,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import { ExternalFile } from '@manuscripts/manuscripts-json-schema'
import {
  Designation,
  getDesignationName,
  RoundIconButton,
  SelectDialogDesignation,
  useDropdown,
} from '@manuscripts/style-guide'
import { Node } from 'prosemirror-model'
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { Dispatch } from '../commands'
import { ExternalFileRef, getAllowedForInFigure } from '../lib/external-files'
import EditableBlock from './EditableBlock'
import { FigureProps } from './FigureComponent'
import { ReactViewComponentProps } from './ReactView'

interface AttachableFilesDropdownProps {
  onSelect: (file: ExternalFile) => void
  files: ExternalFile[]
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  addFigureExFileRef: (relation: string, publicUrl: string) => void
}

export interface viewProps {
  node: ManuscriptNode
  view: ManuscriptEditorView
  getPos: () => number
}

export const setNodeAttrs = (
  figure: Node | undefined,
  viewProps: viewProps,
  dispatch: Dispatch
) => (attrs: Node['attrs']) => {
  const { selection, tr } = viewProps.view.state
  tr.setNodeMarkup(viewProps.getPos() + 1, undefined, {
    // figure in accordance with the schema has to be the first element in the fig element this is why +1 is certain
    ...figure?.attrs,
    ...attrs,
  }).setSelection(selection.map(tr.doc, tr.mapping))

  dispatch(tr)
}

const getFileExtension = (file: File) => {
  return file.name.split('.').pop() || ''
}

export const AttachableFilesDropdown: React.FC<AttachableFilesDropdownProps> = ({
  onSelect,
  files,
  uploadAttachment,
  addFigureExFileRef,
}) => {
  // select and browse local selectio
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
  const allowedFiles = useMemo(() => getAllowedForInFigure(files), [files])
  const [
    isOpenDesignationSelector,
    toggleDesignationSelector,
  ] = useState<boolean>(false)

  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [
    uploadedFileDesignation,
    setUploadedFileDesignation,
  ] = useState<string>('')
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
          toggleOpen()
        }}
      >
        <AttachIcon />
      </RoundIconButton>
      {isOpen && (
        <DropdownContainer>
          {allowedFiles &&
            allowedFiles.map((file, i) => (
              <DropdownItem key={i} onClick={() => onSelect(file)}>
                {file.filename}
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
                    const relation =
                      uploadedFileDesignation === 'figure'
                        ? 'imageRepresentation'
                        : 'dataset'
                    addFigureExFileRef(relation, link)
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

const FigureElement = ({ externalFiles, permissions }: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    contentDOM,
    viewProps,
  }) => {
    const content = useRef<HTMLDivElement>(null)
    const figure = useMemo(() => {
      let figure: Node | undefined
      viewProps.node.content.descendants((node) => {
        if (isTableNode(node) || isFigureNode(node)) {
          figure = node
        }
      })
      return figure
    }, [viewProps.node.content])

    useEffect(() => {
      if (figure?.attrs?.externalFileReferences?.length && contentDOM) {
        figure?.attrs?.externalFileReferences?.map((exRef: ExternalFileRef) => {
          if (exRef) {
            const file = externalFiles?.find(
              (file) => file.publicUrl === exRef.url
            )
            if (file) {
              contentDOM.setAttribute('id', file._id) // to allow focus in this node
            }
          }
        })
      }
    }, [contentDOM, figure?.attrs?.externalFileReferences])

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

    return (
      <EditableBlock canWrite={permissions.write} viewProps={viewProps}>
        <FigureWrapper contentEditable="false">
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
  border: 1px solid #f6f6f6;
  padding-bottom: 0.5rem;
`

export const DropdownWrapper = styled.div`
  position: relative;
`

export const DropdownItem = styled.div`
  padding: 0.5em;
`

export const DropdownContainer = styled.div`
  background: #ffffff;
  box-shadow: 0px 4px 9px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  position: absolute;
  top: 100%;
  z-index: 5;
`

export default FigureElement
