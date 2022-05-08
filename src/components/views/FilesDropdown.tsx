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
import { Model } from '@manuscripts/manuscripts-json-schema'
import {
  AttachIcon,
  DropdownList,
  IconButton,
  IconTextButton,
  inlineFiles,
  RoundIconButton,
  UploadIcon,
  useDropdown,
} from '@manuscripts/style-guide'
import React, { SyntheticEvent, useCallback, useMemo } from 'react'
import styled from 'styled-components'

import {
  addFormatQuery,
  SubmissionAttachment,
} from '../../views/FigureComponent'
import { DropdownWrapper } from '../../views/FigureElement'
import { getIcon, getOtherFiles, getPaperClipButtonFiles } from './utils'

export type ExternalFileIcon = SubmissionAttachment & { icon?: JSX.Element }

interface DropdownProps {
  externalFiles?: SubmissionAttachment[]
  modelMap: Map<string, Model>
  mediaAlternativesEnabled?: boolean
  onUploadClick: (e: SyntheticEvent) => void
  canReplaceFile?: boolean
}

interface OptionsProps extends DropdownProps {
  url: string
  submissionId: string
  canDownloadFile?: boolean
  setFigureAttrs: (attrs: { [p: string]: any }) => void // eslint-disable-line
}

interface FilesDropdownProps extends DropdownProps {
  canUploadFile?: boolean
  addFigureExFileRef: (
    relation: string,
    publicUrl: string,
    attachmentId: string
  ) => void
}

export const FilesDropdown: React.FC<FilesDropdownProps> = ({
  externalFiles,
  modelMap,
  mediaAlternativesEnabled,
  onUploadClick,
  addFigureExFileRef,
  canReplaceFile,
  canUploadFile,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  const inlineAttachmentsIds = useMemo(() => {
    const attachmentsIDs = new Set<string>()
    if (externalFiles) {
      inlineFiles(modelMap, externalFiles).map(({ attachments }) => {
        if (attachments) {
          attachments.map((attachment) => attachmentsIDs.add(attachment.id))
        }
      })
    }
    return attachmentsIDs
    // eslint-disable-next-line
  }, [externalFiles, modelMap.values()])

  const { supplements, otherFiles } = useMemo(
    () =>
      getPaperClipButtonFiles(
        inlineAttachmentsIds,
        externalFiles,
        mediaAlternativesEnabled
      ),
    [externalFiles, inlineAttachmentsIds, mediaAlternativesEnabled]
  )

  const onFileClick = useCallback(
    (e, file: ExternalFileIcon) => {
      toggleOpen(e)
      addFigureExFileRef('imageRepresentation', file.link, file.id)
    },
    [addFigureExFileRef, toggleOpen]
  )

  const onSupplementsClick = useCallback(
    (e) => onFileClick(e, supplements[e.currentTarget.id]),
    [onFileClick, supplements]
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
            disabled={supplements.length < 1 || !canReplaceFile}
            parentToggleOpen={toggleOpen}
            buttonText={'Supplements'}
            list={
              <>
                {supplements.map((file, index) => (
                  <ListItemButton
                    key={file.id}
                    id={index.toString()}
                    onClick={onSupplementsClick}
                  >
                    {file.icon}
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
                    {file.icon}
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
  externalFiles,
  modelMap,
  mediaAlternativesEnabled,
  onUploadClick,
  canReplaceFile,
  canDownloadFile,
  setFigureAttrs,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  const inlineAttachmentsIds = useMemo(() => {
    const attachmentsIDs = new Set<string>()
    if (externalFiles) {
      inlineFiles(modelMap, externalFiles).map(({ attachments }) => {
        if (attachments) {
          attachments.map((attachment) => attachmentsIDs.add(attachment.id))
        }
      })
    }
    return attachmentsIDs
    // eslint-disable-next-line
  }, [externalFiles, modelMap.values()])

  const otherFiles = useMemo(
    () =>
      getOtherFiles(
        inlineAttachmentsIds,
        externalFiles,
        mediaAlternativesEnabled
      ),
    [externalFiles, inlineAttachmentsIds, mediaAlternativesEnabled]
  )

  const onDownloadClick = useCallback(() => window.location.assign(url), [url])

  const onFileClick = useCallback(
    (e) => {
      const index = e.currentTarget.id
      setFigureAttrs({
        src: addFormatQuery(otherFiles[index].link),
        label: otherFiles[index].link,
      })
    },
    [otherFiles, setFigureAttrs]
  )

  return (
    <DropdownWrapper ref={wrapperRef}>
      <OptionsButton className={'options_button'} onClick={toggleOpen}>
        <GutterIconNormal />
      </OptionsButton>
      {isOpen && (
        <DropdownList
          direction={'right'}
          width={128}
          onClick={toggleOpen}
          top={5}
        >
          <ListItemButton onClick={onDownloadClick} disabled={!canDownloadFile}>
            Download
          </ListItemButton>
          <NestedDropdown
            disabled={!canReplaceFile}
            parentToggleOpen={toggleOpen}
            buttonText={'Replace'}
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
        </DropdownList>
      )}
    </DropdownWrapper>
  )
}

const NestedDropdown: React.FC<{
  parentToggleOpen: (e: SyntheticEvent) => void
  buttonText: string
  disabled: boolean
  list: React.ReactNode
}> = ({ parentToggleOpen, buttonText, disabled, list }) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  return (
    <DropdownWrapper ref={wrapperRef}>
      <NestedListButton onClick={toggleOpen} disabled={disabled}>
        {buttonText} <TriangleCollapsed />
      </NestedListButton>
      {isOpen && (
        <NestedListDropdownList
          direction={'right'}
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
  top: 0;
  right: 0;

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
  top: -8px;
  left: -5px;
  z-index: 1;
`

const NestedListButton = styled(ListItemButton)`
  width: 100%;
  &:active,
  &:focus {
    background: #f2fbfc;
  }
`

const NestedListDropdownList = styled(DropdownList)`
  left: 100%;
  top: 0;
`

const UploadButton = styled(IconTextButton)`
  border-top: 1px solid #f2f2f2;
  padding: ${(props) => props.theme.grid.unit * 4}px;
  justify-content: flex-start;
`
