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
import AddIconHighlight from '@manuscripts/assets/react/AddIconHighlight'
import GutterIconNormal from '@manuscripts/assets/react/GutterIconNormal'
import TriangleCollapsed from '@manuscripts/assets/react/TriangleCollapsed'
import { Model, ObjectTypes, Supplement } from '@manuscripts/json-schema'
import {
  AttachIcon,
  DropdownList,
  extensionsWithFileTypesMap,
  FileAttachment,
  FileType,
  fileTypesWithIconMap,
  IconButton,
  IconTextButton,
  RoundIconButton,
  UploadIcon,
  useDropdown,
} from '@manuscripts/style-guide'
import { getModelsByType } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import React, { SyntheticEvent, useCallback } from 'react'
import styled from 'styled-components'

import {
  getFigures,
  getOtherFiles,
  getSupplementFiles,
} from '../../lib/files-maps'
import { addFormatQuery } from '../../views/FigureComponent'
import { DropdownWrapper } from '../../views/FigureElement'

const getIcon = (file: FileAttachment) => {
  const fileExtension = file.name.split('.').pop() || ''
  const fileType = extensionsWithFileTypesMap.get(fileExtension.toLowerCase())
  return fileTypesWithIconMap.get(fileType)
}

const getFileType = (fileName: string) => {
  const fileExtension = fileName.split('.').pop() || ''
  return extensionsWithFileTypesMap.get(fileExtension.toLowerCase())
}

interface DropdownProps {
  getAttachments: () => FileAttachment[]
  mediaAlternativesEnabled?: boolean
  onUploadClick: (e: SyntheticEvent) => void
  canReplaceFile?: boolean
  getDoc: () => ProsemirrorNode
  getModelMap: () => Map<string, Model>
}

interface OptionsProps extends DropdownProps {
  url: string
  canDownloadFile?: boolean
  onDetachClick: () => void
  setFigureAttrs: (attrs: { [p: string]: any }) => void // eslint-disable-line
  canEditArticle?: boolean
  disabled: boolean
}

export interface FilesDropdownProps extends DropdownProps {
  deleteModel: (id: string) => Promise<string>
  canUploadFile?: boolean
  canEditArticle?: boolean
  addFigureExFileRef: (link: string) => void
}

const isFileValidForFigure = (
  fileName: string,
  mediaAlternativesEnabled?: boolean
) => {
  const fileType = getFileType(fileName)
  if (mediaAlternativesEnabled) {
    // TODO:: specify other file types for media Alternatives
    return fileType === FileType.Image
  } else {
    return fileType === FileType.Image
  }
}

export const FilesDropdown: React.FC<FilesDropdownProps> = ({
  deleteModel,
  mediaAlternativesEnabled,
  onUploadClick,
  addFigureExFileRef,
  canReplaceFile,
  canUploadFile,
  getAttachments,
  getDoc,
  getModelMap,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
  const attachments = getAttachments().map((f) => ({ ...f })) || []
  const doc = getDoc()
  const actualModelMap = getModelMap()
  const figures: string[] = getFigures(doc, attachments)

  const supplementFiles = getSupplementFiles(
    actualModelMap,
    attachments,
    (fileName) => isFileValidForFigure(fileName, mediaAlternativesEnabled)
  ).filter((item) => !figures.includes(item.id))

  const otherFiles = getOtherFiles(supplementFiles, attachments, (fileName) =>
    isFileValidForFigure(fileName, mediaAlternativesEnabled)
  ).filter((item) => !figures.includes(item.id))

  const onFileClick = useCallback(
    (e, file: FileAttachment) => {
      toggleOpen(e)
      addFigureExFileRef(file.link)
    },
    [addFigureExFileRef, toggleOpen]
  )

  const onSupplementsClick = useCallback(
    (e) => {
      const file = supplementFiles[e.currentTarget.id]

      const removeFromSupplements = async (file: FileAttachment) => {
        const model = getModelsByType<Supplement>(
          actualModelMap,
          ObjectTypes.Supplement
        ).find(({ href }) => href?.replace('attachment:', '') === file.id)
        if (!model) {
          return
        }
        await deleteModel(model._id)
      }

      onFileClick(e, file)
      removeFromSupplements(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFileClick, supplementFiles]
  )

  const onOtherFilesClick = useCallback(
    (e) => onFileClick(e, otherFiles[e.currentTarget.id]),
    [onFileClick, otherFiles]
  )

  const onNewFileClick = useCallback(
    (e: SyntheticEvent) => {
      onUploadClick(e)
      toggleOpen(e)
    },
    [toggleOpen, onUploadClick]
  )

  return (
    <FilesDropdownWrapper onClick={toggleOpen} ref={wrapperRef}>
      <FilesButton>
        <AttachIcon />
      </FilesButton>
      {isOpen && (
        <DropdownList
          direction={'left'}
          width={208}
          height={187}
          onClick={toggleOpen}
          top={7}
        >
          <NestedDropdown
            disabled={supplementFiles.length < 1 || !canReplaceFile}
            parentToggleOpen={toggleOpen}
            buttonText={'Supplements'}
            list={
              <>
                {supplementFiles.map((file, index) => (
                  <ListItemButton
                    key={file.id}
                    id={index.toString()}
                    onClick={onSupplementsClick}
                  >
                    {getIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <NestedDropdown
            disabled={otherFiles.length < 1 || !canReplaceFile}
            parentToggleOpen={toggleOpen}
            buttonText={'Other files'}
            list={
              <>
                {otherFiles.map((file, index) => (
                  <ListItemButton
                    key={file.id}
                    id={index.toString()}
                    onClick={onOtherFilesClick}
                  >
                    {getIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <UploadButton onClick={onNewFileClick} disabled={!canUploadFile}>
            <AddIconHighlight /> New file...
          </UploadButton>
        </DropdownList>
      )}
    </FilesDropdownWrapper>
  )
}

export const OptionsDropdown: React.FC<OptionsProps> = ({
  url,
  mediaAlternativesEnabled,
  onUploadClick,
  onDetachClick,
  canReplaceFile,
  canDownloadFile,
  canEditArticle,
  setFigureAttrs,
  getAttachments,
  disabled,
  getDoc,
  getModelMap,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
  const attachments = getAttachments().map((f) => ({ ...f })) || []
  const doc = getDoc()
  const figures: string[] = getFigures(doc, attachments)
  const actualModelMap = getModelMap()

  const supplementFiles = getSupplementFiles(
    actualModelMap,
    attachments,
    (fileName) => isFileValidForFigure(fileName, mediaAlternativesEnabled)
  ).filter((item) => !figures.includes(item.id))

  const otherFiles = getOtherFiles(supplementFiles, attachments, (fileName) =>
    isFileValidForFigure(fileName, mediaAlternativesEnabled)
  ).filter((item) => !figures.includes(item.id))

  const onDownloadClick = useCallback(() => window.location.assign(url), [url])

  const onFileClick = useCallback(
    (e) => {
      const index = e.currentTarget.id
      setFigureAttrs({
        src: addFormatQuery(otherFiles[index].link),
        label: otherFiles[index].link,
        externalFileReferences: [
          {
            kind: 'imageRepresentation',
            url: addFormatQuery(otherFiles[index].link),
          },
        ],
      })
    },
    [otherFiles, setFigureAttrs]
  )

  return (
    <DropdownWrapper ref={wrapperRef}>
      <OptionsButton className={'options-button'} onClick={toggleOpen}>
        <GutterIconNormal />
      </OptionsButton>
      {isOpen && (
        <OptionsDropdownList
          direction={'right'}
          width={128}
          onClick={toggleOpen}
          top={5}
        >
          <ListItemButton
            onClick={onDownloadClick}
            disabled={disabled || !canDownloadFile}
          >
            Download
          </ListItemButton>
          <NestedDropdown
            disabled={!canReplaceFile || disabled}
            parentToggleOpen={toggleOpen}
            buttonText={'Replace'}
            moveLeft
            list={
              <>
                {otherFiles.map((file, index) => (
                  <ListItemButton
                    key={file.id}
                    id={index.toString()}
                    onClick={onFileClick}
                  >
                    {getIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
                <UploadButton onClick={onUploadClick}>
                  <UploadIcon /> Upload new...
                </UploadButton>
              </>
            }
          />
          <ListItemButton
            onClick={onDetachClick}
            disabled={disabled || !canEditArticle}
          >
            Detach
          </ListItemButton>
        </OptionsDropdownList>
      )}
    </DropdownWrapper>
  )
}

const NestedDropdown: React.FC<{
  parentToggleOpen: (e: SyntheticEvent) => void
  buttonText: string
  disabled: boolean
  list: React.ReactNode
  moveLeft?: boolean
}> = ({ parentToggleOpen, buttonText, disabled, list, moveLeft }) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  return (
    <DropdownWrapper ref={wrapperRef}>
      <NestedListButton onClick={toggleOpen} disabled={disabled}>
        {buttonText} <TriangleCollapsed />
      </NestedListButton>
      {isOpen && (
        <NestedListDropdownList
          direction={'right'}
          moveLeft={moveLeft}
          width={192}
          onClick={(e) => {
            toggleOpen(e)
            parentToggleOpen(e)
          }}
        >
          {list}
        </NestedListDropdownList>
      )}
    </DropdownWrapper>
  )
}

const OptionsDropdownList = styled(DropdownList)`
  right: 4%;
`

const OptionsButton = styled(IconButton)`
  border: 1px solid #e2e2e2 !important;
  box-sizing: border-box;
  border-radius: 50%;
  width: ${(props) => props.theme.grid.unit * 6}px;
  height: ${(props) => props.theme.grid.unit * 6}px;
  margin: ${(props) => props.theme.grid.unit}px;
  visibility: hidden;
  background: white;
  position: absolute;
  top: -4px;
  right: 4%;

  &:hover {
    background: #f2fbfc !important;
    border: 1px solid #e2e2e2 !important;
  }

  &:active,
  &:focus {
    background: #f2fbfc !important;
    border: 1px solid #e2e2e2 !important;

    circle {
      fill: #1a9bc7;
    }
  }

  circle {
    fill: #6e6e6e;
  }
`

const ListItemButton = styled(IconTextButton)`
  padding: 16px 14px;
  justify-content: space-between;
  align-items: center;

  :hover {
    background: #f2fbfc;
  }

  &:is([disabled]) {
    background: white !important;
    color: #353535 !important;
    opacity: 0.4;
  }
`

const ListItemText = styled.div`
  width: 141px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: start;
`

const FilesButton = styled(RoundIconButton)`
  path {
    stroke: #6e6e6e;
  }

  &:active,
  &:focus {
    path {
      stroke: #1a9bc7;
    }
  }
`

const FilesDropdownWrapper = styled.div`
  position: absolute;
  top: 8px;
  left: 70px;
  z-index: 1;
`

const NestedListButton = styled(ListItemButton)`
  width: 100%;
  &:active,
  &:focus {
    background: #f2fbfc;
  }
`

const NestedListDropdownList = styled(DropdownList)<{ moveLeft?: boolean }>`
  top: 0;
  ${(props) => (props.moveLeft && 'right: 30%;') || 'left: 100%;'}
`

const UploadButton = styled(IconTextButton)`
  border-top: 1px solid #f2f2f2;
  padding: ${(props) => props.theme.grid.unit * 4}px;
  justify-content: flex-start;
`
