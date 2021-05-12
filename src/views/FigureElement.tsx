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
  FileSectionItem,
  isDataset,
  isFigure,
  isFileDroppable,
  RoundIconButton,
  useDropdown,
} from '@manuscripts/style-guide'
import { Node } from 'prosemirror-model'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import styled from 'styled-components'

import { Dispatch } from '../commands'
import { addExternalFileRef, ExternalFileRef } from '../lib/external-files'
import EditableBlock from './EditableBlock'
import { FigureProps } from './FigureComponent'
import { ReactViewComponentProps } from './ReactView'

interface AttachableFilesDropdownProps {
  onSelect: (file: ExternalFile) => void
  files: ExternalFile[]
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

export const AttachableFilesDropdown: React.FC<AttachableFilesDropdownProps> = ({
  onSelect,
  files,
}) => {
  // select and browse local selectio
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()
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
          {files &&
            files.map((file, i) => (
              <DropdownItem key={i} onClick={() => onSelect(file)}>
                {file.filename}
              </DropdownItem>
            ))}
        </DropdownContainer>
      )}
    </DropdownWrapper>
  )
}

export const isTableNode = (node: Node) =>
  node.type === node.type.schema.nodes.table
export const isFigureNode = (node: Node) =>
  node.type === node.type.schema.nodes.figure

const FigureElement = ({
  externalFiles,
  submissionId,
  updateDesignation,
  permissions,
}: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    contentDOM,
    viewProps,
    dispatch,
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

    const dataset =
      figure &&
      figure.attrs?.externalFileReferences?.find(
        (file: ExternalFileRef) => file.kind === 'dataset'
      )
    const allowedFiles = externalFiles?.filter((file) => isFileDroppable(file))

    useEffect(() => {
      if (content && content.current) {
        content.current.appendChild(
          contentDOM || document.createElement('figure')
        )
      }
    }, [contentDOM])

    /* eslint-disable react-hooks/exhaustive-deps */
    const setFigureAttrs = useCallback(
      /* eslint-enable react-hooks/exhaustive-deps */
      setNodeAttrs(figure, viewProps, dispatch),
      [figure, viewProps, dispatch]
    )

    const handleSelectedFile = (file: ExternalFile) => {
      if (!figure) {
        return
      }
      const prevAttrs = { ...figure.attrs }
      if (isDataset(file)) {
        setFigureAttrs({
          externalFileReferences: addExternalFileRef(
            figure?.attrs.externalFileReferences,
            file.publicUrl,
            'dataset',
            { ref: file }
          ),
        })
        updateDesignation('dataset', file.filename).catch(() => {
          setFigureAttrs(prevAttrs)
        })
      }
      if (isFigure(file)) {
        setFigureAttrs({
          externalFileReferences: addExternalFileRef(
            figure?.attrs.externalFileReferences,
            file.publicUrl,
            'imageRepresentation',
            { ref: file }
          ),
          src: file.publicUrl,
        })
        updateDesignation('dataset', file.filename).catch(() => {
          setFigureAttrs(prevAttrs)
        })
      }
    }

    return (
      <EditableBlock canWrite={permissions.write} viewProps={viewProps}>
        <FigureWrapper contentEditable="false">
          {allowedFiles && (
            <AttachableFilesDropdown
              files={allowedFiles}
              onSelect={handleSelectedFile}
            />
          )}
          <div contentEditable="true" ref={content}></div>
          {figure && dataset?.ref && (
            <AlternativesList>
              <FileSectionItem
                submissionId={submissionId}
                title={
                  dataset.ref.filename ||
                  dataset.ref.displayName ||
                  dataset.ref.filename
                }
                handleChangeDesignation={(
                  submissionId: string,
                  typeId: string,
                  name: string
                ) => updateDesignation(typeId, name)}
                externalFile={dataset.ref}
                showDesignationActions={true}
              />
            </AlternativesList>
          )}
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
