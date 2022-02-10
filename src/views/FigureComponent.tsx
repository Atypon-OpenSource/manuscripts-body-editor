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

import {
  FigureNode,
  isInGraphicalAbstractSection,
} from '@manuscripts/manuscript-transform'
import { ExternalFile } from '@manuscripts/manuscripts-json-schema'
import {
  Capabilities,
  FileSectionItem,
  isFigure,
} from '@manuscripts/style-guide'
import { Node } from 'prosemirror-model'
import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import styled from 'styled-components'

import {
  addExternalFileRef,
  ExternalFileRef,
  removeExternalFileRef,
} from '../lib/external-files'
import {
  AlternativesList,
  AttachableFilesDropdown,
  setNodeAttrs as setGivenNodeAttrs,
} from './FigureElement'
import { ReactViewComponentProps } from './ReactView'

export interface FigureProps {
  permissions: { write: boolean }
  putAttachment: (file: File, type: string) => Promise<string>
  externalFiles?: ExternalFile[]
  submissionId: string
  uploadAttachment: (designation: string, file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  updateDesignation: (designation: string, name: string) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  capabilities?: Capabilities
  onlyGraphic?: boolean
}

const WEB_FORMAT_QUERY = 'format=jpg'
const addFormatQuery = (url?: string) => {
  if (url) {
    const join = url.includes('?') ? '&' : '?'
    return url + join + WEB_FORMAT_QUERY
  }
}

const FigureComponent = ({
  putAttachment,
  permissions,
  uploadAttachment,
  updateDesignation,
  capabilities: can,
  externalFiles,
  submissionId,
}: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    nodeAttrs,
    viewProps,
    dispatch,
    setNodeAttrs,
    contentDOM,
  }) => {
    const figure = viewProps.node

    const onlyGraphic = useMemo(() => {
      // allows to manipulate only images, needed for graphical abstract
      const resolvedPos = viewProps.view.state.doc.resolve(viewProps.getPos())
      return isInGraphicalAbstractSection(resolvedPos)
    }, [viewProps])

    const src = useMemo(() => {
      if (nodeAttrs.src) {
        return nodeAttrs.src
      }

      const imageExternalFile = nodeAttrs.externalFileReferences?.find(
        (file) => file && file.kind === 'imageRepresentation'
      )
      return addFormatQuery(imageExternalFile?.url) // these links are always provided with url query, it's safe to assume we need to use amp here
    }, [nodeAttrs.src]) // eslint-disable-line react-hooks/exhaustive-deps

    const fileInput = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (figure?.attrs?.externalFileReferences?.length) {
        figure?.attrs?.externalFileReferences?.map((exRef: ExternalFileRef) => {
          if (exRef && typeof exRef.ref === 'undefined') {
            const ref = externalFiles?.find(
              (file) => file.publicUrl === exRef.url
            )
            exRef.ref = ref
            if (ref) {
              setFigureAttrs({
                externalFileReferences: [
                  ...figure?.attrs.externalFileReferences,
                ],
              })
            }
          }
        })
      }
    }, [externalFiles]) // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleUpload = async (e: SyntheticEvent) => {
      e.preventDefault()

      const file = fileInput.current?.files?.[0]

      if (!file || !permissions.write) {
        return
      }
      const url = await putAttachment(file, 'figure')
      setNodeAttrs({
        contentType: file.type,
        externalFileReferences: addExternalFileRef(
          nodeAttrs.externalFileReferences,
          url,
          'imageRepresentation'
        ),
        src: addFormatQuery(url),
        label: url,
      })
    }

    const handleImageClick = (e: SyntheticEvent) => {
      e.preventDefault()

      if (!permissions.write || !fileInput.current) {
        return
      }

      fileInput.current.click()
    }

    /* eslint-disable react-hooks/exhaustive-deps */
    const setFigureAttrs = useCallback(
      /* eslint-enable react-hooks/exhaustive-deps */
      setGivenNodeAttrs(figure, viewProps, dispatch),
      [figure, viewProps, dispatch]
    )

    const handleSelectedFile = (file: ExternalFile) => {
      if (!figure) {
        return
      }
      const prevAttrs = { ...figure.attrs }
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
      } else {
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
    }

    const dataset: ExternalFileRef =
      figure &&
      figure.attrs?.externalFileReferences?.find(
        (file: ExternalFileRef) => file && file.kind === 'dataset'
      )

    return (
      <>
        {can?.changeDesignation && externalFiles && (
          <AttachableFilesDropdown
            files={externalFiles}
            onSelect={handleSelectedFile}
            uploadAttachment={uploadAttachment}
            addFigureExFileRef={(relation, publicUrl) => {
              if (figure) {
                const newAttrs: Node['attrs'] = {
                  externalFileReferences: addExternalFileRef(
                    figure?.attrs.externalFileReferences,
                    publicUrl,
                    onlyGraphic ? 'imageRepresentation' : relation
                  ),
                }
                if (relation == 'imageRepresentation') {
                  newAttrs.src = publicUrl
                }
                setFigureAttrs(newAttrs)
              }
            }}
          />
        )}
        {permissions.write && (
          <HiddenInput
            type="file"
            ref={fileInput}
            onChange={handleUpload}
            accept="image/*"
          />
        )}
        {src ? (
          <UnstyledButton type="button" onClick={handleImageClick}>
            <img
              src={src}
              alt={nodeAttrs.label}
              style={{ cursor: 'pointer' }}
            />
          </UnstyledButton>
        ) : (
          <UnstyledButton type="button" onClick={handleImageClick}>
            <Placeholder>
              <div>
                {permissions.write
                  ? 'Click to add image'
                  : 'No image here yet…'}
              </div>
            </Placeholder>
          </UnstyledButton>
        )}
        {!onlyGraphic && figure && dataset?.ref && (
          <AlternativesList>
            <FileSectionItem
              submissionId={submissionId}
              title={dataset.ref.filename || dataset.ref.displayName || ''}
              handleChangeDesignation={(
                submissionId: string,
                typeId: string,
                name: string
              ) => updateDesignation(typeId, name)}
              externalFile={dataset.ref}
              showDesignationActions={false}
              onClose={() => {
                setFigureAttrs({
                  externalFileReferences: removeExternalFileRef(
                    figure?.attrs.externalFileReferences,
                    dataset.url
                  ),
                })
              }}
            />
          </AlternativesList>
        )}
      </>
    )
  }

  return Component
}

const HiddenInput = styled.input`
  display: none;
`

const UnstyledButton = styled.button`
  display: block;
  border: none;
  background: none;
  margin-left: auto;
  margin-right: auto;
  min-width: 250px;
  padding: 0;

  &:focus {
    outline: rgb(13, 121, 208) auto 1px;
  }
  img {
    max-width: 100%;
  }
`

const Placeholder = styled.div`
  align-items: center;
  border-radius: 16px;
  border: 1px dashed #e2e2e2;
  color: #6e6e6e;
  cursor: pointer;
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 64px 32px;
  min-height: 100px;
`

export default FigureComponent
