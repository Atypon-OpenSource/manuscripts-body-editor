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
import {
  AddIcon,
  AttachIcon,
  Capabilities,
  DotsIcon,
  DropdownList,
  getFileIcon,
  IconButton,
  IconTextButton,
  isImageFile,
  RoundIconButton,
  TriangleCollapsedIcon,
  UploadIcon,
  useDropdown,
} from '@manuscripts/style-guide'
import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'

import { FileAttachment, ManuscriptFiles } from '../../lib/files'

export interface FigureDropdownProps {
  can: Capabilities
  files: ManuscriptFiles
}

export interface FigureOptionsProps extends FigureDropdownProps {
  onDownload?: () => void
  onUpload?: () => void
  onDetach?: () => void
  onReplace?: (file: FileAttachment) => void
}

export interface FigureElementOptionsProps extends FigureDropdownProps {
  onAdd: (file: FileAttachment) => Promise<void>
  onUpload: () => void
  hasUploadedImage: boolean
}

export const FigureElementOptions: React.FC<FigureElementOptionsProps> = ({
  can,
  files,
  onAdd,
  onUpload,
  hasUploadedImage,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  const supplements = files.supplements
    .map((s) => s.file)
    .filter((f) => isImageFile(f.name))

  const others = files.others.filter((f) => isImageFile(f.name))

  return (
    <FilesDropdownWrapper onClick={toggleOpen} ref={wrapperRef}>
      <FilesButton disabled={hasUploadedImage}>
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
            disabled={!can.replaceFile || supplements.length < 1}
            parentToggleOpen={toggleOpen}
            buttonText={'Supplements'}
            list={
              <>
                {supplements.map((file) => (
                  <ListItemButton key={file.id} onClick={() => onAdd(file)}>
                    {getFileIcon(file.name)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <NestedDropdown
            disabled={!can.replaceFile || others.length < 1}
            parentToggleOpen={toggleOpen}
            buttonText={'Other files'}
            list={
              <>
                {others.map((file) => (
                  <ListItemButton key={file.id} onClick={() => onAdd(file)}>
                    {getFileIcon(file.name)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <UploadButton onClick={onUpload} disabled={!can.uploadFile}>
            <AddIcon /> New file...
          </UploadButton>
        </DropdownList>
      )}
    </FilesDropdownWrapper>
  )
}

export const FigureOptions: React.FC<FigureOptionsProps> = ({
  can,
  files,
  onDownload,
  onUpload,
  onDetach,
  onReplace,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  const otherFiles = files.others.filter((f) => isImageFile(f.name))

  const showDownload = onDownload && can.downloadFiles
  const showUpload = onUpload && can.uploadFile
  const showDetach = onDetach && can.detachFile
  const showReplace = onReplace && can.replaceFile

  return (
    <DropdownWrapper ref={wrapperRef}>
      <OptionsButton className={'options-button'} onClick={toggleOpen}>
        <DotsIcon />
      </OptionsButton>
      {isOpen && (
        <OptionsDropdownList direction={'right'} width={128} top={5}>
          <ListItemButton onClick={onDownload} disabled={!showDownload}>
            Download
          </ListItemButton>
          <NestedDropdown
            disabled={!showReplace}
            parentToggleOpen={toggleOpen}
            buttonText={'Replace'}
            moveLeft
            list={
              <>
                {otherFiles.map((file, index) => (
                  <ListItemButton
                    key={file.id}
                    id={index.toString()}
                    onClick={() => onReplace && onReplace(file)}
                  >
                    {getFileIcon(file.name)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
                <UploadButton onClick={onUpload} disabled={!showUpload}>
                  <UploadIcon /> Upload new...
                </UploadButton>
              </>
            }
          />
          <ListItemButton onClick={onDetach} disabled={!showDetach}>
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
        {buttonText} <TriangleCollapsedIcon />
      </NestedListButton>
      {isOpen && (
        <NestedListDropdownList
          direction={'right'}
          moveLeft={moveLeft}
          width={192}
          onClick={(e) => {
            toggleOpen()
            parentToggleOpen(e)
          }}
        >
          {list}
        </NestedListDropdownList>
      )}
    </DropdownWrapper>
  )
}

const DropdownWrapper = styled.div``

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
