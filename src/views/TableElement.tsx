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

import { FigureNode } from '@manuscripts/manuscript-transform'
import { FileSectionItem } from '@manuscripts/style-guide'
import { Node } from 'prosemirror-model'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { addExternalFileRef, ExternalFileRef } from '../lib/external-files'
import { setNodeAttrs } from '../lib/utils'
import EditableBlock from './EditableBlock'
import { FigureProps, SubmissionAttachment } from './FigureComponent'
import {
  AlternativesList,
  AttachableFilesDropdown,
  FigureWrapper,
  isFigureNode,
  isTableNode,
} from './FigureElement'
import { ReactViewComponentProps } from './ReactView'

const TableElement = ({
  externalFiles,
  updateDesignation,
  uploadAttachment,
  capabilities: can,
  mediaAlternativesEnabled,
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

    useEffect(() => {
      if (contentDOM) {
        contentDOM.classList.add('block')
        contentDOM.setAttribute('id', viewProps.node.attrs.id)
      }
    }, [contentDOM, viewProps.node.attrs.id])

    useEffect(() => {
      if (content && content.current && contentDOM) {
        content.current.appendChild(contentDOM)
      }
    }, [contentDOM])

    useEffect(() => {
      const {
        suppressCaption,
        suppressHeader,
        suppressFooter,
        suppressTitle,
      } = viewProps.node.attrs
      if (content.current) {
        content.current.classList.toggle('suppress-caption', suppressCaption)
        content.current.classList.toggle('suppress-header', suppressHeader)
        content.current.classList.toggle('suppress-footer', suppressFooter)
        content.current.classList.toggle(
          'suppress-title',
          suppressTitle === undefined ? true : suppressTitle
        )

        if (contentDOM) {
          contentDOM.setAttribute(
            'data-paragraph-style',
            viewProps.node.attrs.paragraphStyle
          )
          contentDOM.setAttribute(
            'data-table-style',
            viewProps.node.attrs.tableStyle
          )
        }
      }
    }, [viewProps.node.attrs, contentDOM])

    /* eslint-disable react-hooks/exhaustive-deps */
    const setTableAttrs = useCallback(
      /* eslint-enable react-hooks/exhaustive-deps */
      setNodeAttrs(figure, viewProps, dispatch),
      [figure, viewProps, dispatch]
    )

    const handleSelectedFile = (file: SubmissionAttachment) => {
      if (!figure) {
        return
      }
      const prevAttrs = { ...figure.attrs }
      setTableAttrs({
        externalFileReferences: addExternalFileRef(
          figure?.attrs.externalFileReferences,
          file.id,
          'dataset',
          { ref: file }
        ),
      })
      updateDesignation('dataset', file.name).catch(() => {
        setTableAttrs(prevAttrs)
      })
    }
    return (
      <EditableBlock canWrite={!!can?.editArticle} viewProps={viewProps}>
        <FigureWrapper contentEditable="false">
          {mediaAlternativesEnabled && can?.changeDesignation && externalFiles && (
            <AttachableFilesDropdown
              files={externalFiles}
              onSelect={handleSelectedFile}
              uploadAttachment={uploadAttachment}
              addFigureExFileRef={(relation, publicUrl, attachmentId) => {
                if (figure) {
                  const newAttrs: Node['attrs'] = {
                    externalFileReferences: addExternalFileRef(
                      figure?.attrs.externalFileReferences,
                      attachmentId,
                      relation
                    ),
                  }
                  if (relation == 'imageRepresentation') {
                    newAttrs.src = publicUrl
                  }
                  setTableAttrs(newAttrs)
                }
              }}
            />
          )}
          <div contentEditable="true" ref={content}></div>
          {figure && dataset?.ref && (
            <AlternativesList>
              <FileSectionItem
                title={
                  dataset.ref.filename ||
                  dataset.ref.displayName ||
                  dataset.ref.filename
                }
                handleChangeDesignation={(typeId: string, name: string) =>
                  updateDesignation(typeId, name)
                }
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

export default TableElement
