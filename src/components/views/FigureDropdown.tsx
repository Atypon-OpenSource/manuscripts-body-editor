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
  DotsIcon,
  DropdownList,
  getFileIcon,
  IconButton,
  IconTextButton,
  TriangleCollapsedIcon,
  UploadIcon,
  useDropdown,
} from '@manuscripts/style-guide'
import { FigureNode } from '@manuscripts/transform'
import { Node as ManuscriptNode } from 'prosemirror-model'
import React, { SyntheticEvent, useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { Capabilities } from '../../lib/capabilities'
import {
  FileAttachment,
  ManuscriptFiles,
  memoGroupFiles,
} from '../../lib/files'
import { getMediaTypeInfo } from '../../lib/get-media-type'
import {
  handleArrowNavigation,
  handleEnterKey,
} from '../../lib/navigation-utils'
import { ReactViewComponentProps } from '../../views/ReactSubView'

// Custom hook for figure dropdown keyboard navigation
function useDropdownKeyboardNav(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onEscape: () => void,
  onArrowLeft?: () => void
) {
  useEffect(() => {
    const container = containerRef.current
    if (!isOpen || !container) {
      return
    }

    const buttons = Array.from(
      container.querySelectorAll('button:not([disabled])')
    ) as HTMLElement[]

    if (buttons.length === 0) {
      return
    }

    // Add keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      // Handle arrow navigation (ArrowDown/ArrowUp)
      handleArrowNavigation(event, buttons, target, {
        forward: 'ArrowDown',
        backward: 'ArrowUp',
      })

      // Handle Enter key
      handleEnterKey(() => target.click())(event)

      // Handle other keys
      if (event.key === 'ArrowLeft' && onArrowLeft) {
        event.preventDefault()
        onArrowLeft()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Focus first button when dropdown opens
    window.requestAnimationFrame(() => {
      buttons[0]?.focus()
    })

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, containerRef, onEscape, onArrowLeft])
}

export interface FigureDropdownProps {
  can: Capabilities
  getFiles: () => FileAttachment[]
}

export interface FigureOptionsProps extends FigureDropdownProps {
  onDownload?: () => void
  onUpload?: () => void
  onDetach?: () => void
  onReplace?: (file: FileAttachment, isSupplement?: boolean) => void
  onReplaceEmbed?: () => void
  getDoc: () => ManuscriptNode
  onDelete?: () => void
  isEmbed: boolean
  hasSiblings: () => boolean
}

export interface FigureElementOptionsProps extends FigureDropdownProps {
  onAdd: (file: FileAttachment) => Promise<void>
  onUpload: () => void
  hasUploadedImage: boolean
}

function getSupplements(
  getFiles: () => FileAttachment[],
  getDoc: () => ManuscriptNode,
  groupFiles: (doc: ManuscriptNode, files: FileAttachment[]) => ManuscriptFiles,
  isEmbed: boolean
) {
  return groupFiles(getDoc(), getFiles())
    .supplements.map((s) => s.file)
    .filter((f) => {
      const mediaInfo = getMediaTypeInfo(f.name)
      return isEmbed
        ? mediaInfo.isVideo || mediaInfo.isAudio
        : mediaInfo.isImage
    })
}

function getOtherFiles(
  getFiles: () => FileAttachment[],
  getDoc: () => ManuscriptNode,
  groupFiles: (doc: ManuscriptNode, files: FileAttachment[]) => ManuscriptFiles,
  isEmbed: boolean
) {
  return groupFiles(getDoc(), getFiles()).others.filter((f) => {
    const mediaInfo = getMediaTypeInfo(f.name)
    return isEmbed ? mediaInfo.isVideo || mediaInfo.isAudio : mediaInfo.isImage
  })
}

type WrappedProps = FigureOptionsProps & ReactViewComponentProps<FigureNode>

export const FigureOptions: React.FC<WrappedProps> = ({
  can,
  getDoc,
  getFiles,
  onDownload,
  onUpload,
  onDetach,
  onReplace,
  onReplaceEmbed,
  onDelete,
  isEmbed,
  hasSiblings,
  container,
}) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const showDownload = onDownload && can.downloadFiles
  const showUpload = onUpload && can.uploadFile
  const showDetach = onDetach && can.detachFile
  const showReplace =
    (onReplace && can.replaceFile) || (onReplaceEmbed && can.editArticle)
  const replaceBtnText = onDownload ? 'Replace' : 'Choose file'
  const showDelete = () => {
    if (!hasSiblings()) {
      return false
    }
    if (onDelete && can.detachFile) {
      return true
    }
    return false
  }

  useEffect(() => {
    const activeClass = 'figure-dropdown-active'
    if (isOpen) {
      container.classList.add(activeClass)
    } else {
      container.classList.remove(activeClass)
    }
  }, [isOpen, container.classList])

  useDropdownKeyboardNav(isOpen, dropdownRef, toggleOpen)

  const isEmbedMode = !!onReplaceEmbed

  const groupFiles = memoGroupFiles()

  return (
    <DropdownWrapper ref={wrapperRef}>
      <OptionsButton
        className={'options-button'}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            toggleOpen()
          }
        }}
      >
        <DotsIcon />
      </OptionsButton>
      {isOpen && (
        <OptionsDropdownList
          direction={'right'}
          width={128}
          top={5}
          ref={dropdownRef}
        >
          {showReplace && isEmbedMode && (
            <ListItemButton onClick={() => onReplaceEmbed && onReplaceEmbed()}>
              Edit Link
            </ListItemButton>
          )}
          {showReplace && !isEmbedMode && (
            <NestedDropdown
              disabled={!showReplace}
              parentToggleOpen={toggleOpen}
              buttonText={replaceBtnText}
              moveLeft
              list={
                <>
                  {getSupplements(getFiles, getDoc, groupFiles, isEmbed).map(
                    (file, index) => (
                      <ListItemButton
                        key={file.id}
                        id={index.toString()}
                        onClick={() => onReplace && onReplace(file, true)}
                      >
                        {getFileIcon(file.name)}
                        <ListItemText>{file.name}</ListItemText>
                      </ListItemButton>
                    )
                  )}
                  {getOtherFiles(getFiles, getDoc, groupFiles, isEmbed).map(
                    (file, index) => (
                      <ListItemButton
                        key={file.id}
                        id={index.toString()}
                        onClick={() => onReplace && onReplace(file)}
                      >
                        {getFileIcon(file.name)}
                        <ListItemText>{file.name}</ListItemText>
                      </ListItemButton>
                    )
                  )}
                  {showUpload && (
                    <UploadButton onClick={onUpload} disabled={!showUpload}>
                      <UploadIcon /> Upload new...
                    </UploadButton>
                  )}
                </>
              }
            />
          )}
          {showDownload && (
            <ListItemButton onClick={onDownload} disabled={!showDownload}>
              Download
            </ListItemButton>
          )}
          {showDetach && (
            <ListItemButton onClick={onDetach} disabled={!showDetach}>
              Detach
            </ListItemButton>
          )}
          {showDelete() && (
            <ListItemButton onClick={onDelete}>Delete</ListItemButton>
          )}
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
  const nestedListRef = useRef<HTMLDivElement>(null)

  // Handle ArrowLeft to close nested dropdown and focus parent
  const handleArrowLeft = useCallback(() => {
    toggleOpen()
    const parentButton = wrapperRef.current?.querySelector(
      '.nested-list-button'
    ) as HTMLElement
    parentButton?.focus()
  }, [toggleOpen, wrapperRef])

  // For nested dropdown: Escape and ArrowLeft both close nested menu and return to parent
  useDropdownKeyboardNav(
    isOpen,
    nestedListRef,
    handleArrowLeft,
    handleArrowLeft
  )

  return (
    <DropdownWrapper ref={wrapperRef}>
      <NestedListButton
        className="nested-list-button"
        onClick={toggleOpen}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault()
            toggleOpen()
          }
        }}
      >
        <div>{buttonText}</div>
        <TriangleCollapsedIcon />
      </NestedListButton>
      {isOpen && (
        <NestedListDropdownList
          direction={'right'}
          moveLeft={moveLeft}
          width={192}
          ref={nestedListRef}
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
  background: #ffffff;

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

  :hover,
  :focus-visible {
    background: #f2fbfc;
  }

  &:is([disabled]) {
    background: #ffffff;
    color: #353535;
    opacity: 0.4;
  }
`

const ListItemText = styled.div`
  width: 141px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: start;
`

const NestedListButton = styled(ListItemButton)`
  width: 100%;
  &:active,
  &:focus,
  &:focus-visible {
    background: #f2fbfc;
  }
  svg {
    margin-right: 0;
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

  &:focus-visible {
    background: #f2fbfc;
  }
`
