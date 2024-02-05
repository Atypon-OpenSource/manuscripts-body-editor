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
import {
  AttachIcon,
  Capabilities,
  DropdownList,
  FileAttachment,
  getFileIcon,
  IconButton,
  IconTextButton,
  isImageFile,
  RoundIconButton,
  UploadIcon,
  useDropdown,
  useFiles,
} from '@manuscripts/style-guide'
import { ManuscriptNode } from '@manuscripts/transform'
import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'

export interface FigureDropdownProps {
  can: Capabilities
  files: FileAttachment[]
  doc: ManuscriptNode
}

export interface FigureOptionsProps extends FigureDropdownProps {
  handleDownload?: () => void
  handleUpload?: () => void
  handleDetach?: () => void
  handleReplace?: (file: FileAttachment) => void
}

export interface FigureElementOptionsProps extends FigureDropdownProps {
  handleAdd: (file: FileAttachment) => Promise<void>
  handleUpload: () => void
}

export const FigureElementOptions: React.FC<FigureElementOptionsProps> = ({
  can,
  files,
  doc,
  handleAdd,
  handleUpload,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  let { supplements, otherFiles } = useFiles(doc, files)
  supplements = supplements.filter(isImageFile)
  otherFiles = otherFiles.filter(isImageFile)

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
            disabled={!can.replaceFile || supplements.length < 1}
            parentToggleOpen={toggleOpen}
            buttonText={'Supplements'}
            list={
              <>
                {supplements.map((file) => (
                  <ListItemButton key={file.id} onClick={() => handleAdd(file)}>
                    {getFileIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <NestedDropdown
            disabled={!can.replaceFile || otherFiles.length < 1}
            parentToggleOpen={toggleOpen}
            buttonText={'Other files'}
            list={
              <>
                {otherFiles.map((file) => (
                  <ListItemButton key={file.id} onClick={() => handleAdd(file)}>
                    {getFileIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
              </>
            }
          />
          <UploadButton onClick={handleUpload} disabled={!can.uploadFile}>
            <AddIconHighlight /> New file...
          </UploadButton>
        </DropdownList>
      )}
    </FilesDropdownWrapper>
  )
}

export const FigureOptions: React.FC<FigureOptionsProps> = ({
  can,
  files,
  doc,
  handleDownload,
  handleUpload,
  handleDetach,
  handleReplace,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  const otherFiles = useFiles(doc, files).otherFiles.filter(isImageFile)

  const showDownload = handleDownload && can.downloadFiles
  const showUpload = handleUpload && can.uploadFile
  const showDetach = handleDetach && can.editArticle
  const showReplace = handleReplace && can.replaceFile

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
          <ListItemButton onClick={handleDownload} disabled={!showDownload}>
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
                    onClick={() => handleReplace && handleReplace(file)}
                  >
                    {getFileIcon(file)}
                    <ListItemText>{file.name}</ListItemText>
                  </ListItemButton>
                ))}
                <UploadButton onClick={handleUpload} disabled={!showUpload}>
                  <UploadIcon /> Upload new...
                </UploadButton>
              </>
            }
          />
          <ListItemButton onClick={handleDetach} disabled={!showDetach}>
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
