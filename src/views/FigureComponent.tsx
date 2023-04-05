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

import { Model } from '@manuscripts/json-schema'
import {
  Capabilities,
  SubmissionAttachment,
  UnsupportedFormatFileIcon,
} from '@manuscripts/style-guide'
import {
  FigureNode,
} from '@manuscripts/transform'
import React, { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'

import { useFileInputRef } from '../components/hooks/figure-upload'
import { OptionsDropdown } from '../components/views/FilesDropdown'
import { FileUpload } from '../components/views/FileUpload'
import { addExternalFileRef, ExternalFileRef } from '../lib/external-files'
import { setNodeAttrs as setGivenNodeAttrs } from '../lib/utils'
import { ReactViewComponentProps } from './ReactView'

// export type SubmissionAttachment = {
//   id: string
//   name: string
//   type: SubmissionAttachmentType
//   link: string
// }

// export type SubmissionAttachmentType = {
//   id: string
//   label?: string
// }

export interface FigureProps {
  getAttachments: () => SubmissionAttachment[]
  modelMap: Map<string, Model>
  submissionId: string
  uploadAttachment: (file: File) => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  capabilities?: Capabilities
  mediaAlternativesEnabled?: boolean
}

export const WEB_FORMAT_QUERY = 'format=jpg'
export const addFormatQuery = (url: string) => {
  const join = url.includes('?') ? '&' : '?'
  return url + join + WEB_FORMAT_QUERY
}

const FigureComponent = ({
  uploadAttachment,
  capabilities: can,
  mediaAlternativesEnabled,
  getAttachments,
  submissionId,
  modelMap,
}: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    nodeAttrs,
    viewProps,
    dispatch,
    contentDOM,
  }) => {
    const figure = viewProps.node
    const src = useMemo(() => {
      if (nodeAttrs.src) {
        return nodeAttrs.src
      }
      const imageExternalFile = {
        url: 'test',
      }
      // in the new implementation ExternalFileRef url will be attachment id LEAN-988
      let url = imageExternalFile?.url
      if (!imageExternalFile?.url.includes('https://')) {
        const attachmentId = imageExternalFile?.url.replace('attachment:', '')
        url =
          getAttachments()?.find((file) => file.id === attachmentId)?.link || ''
      }

      return addFormatQuery(url || '') // these links are always provided with url query, it's safe to assume we need to use amp here
    }, [nodeAttrs.src, getAttachments]) // eslint-disable-line react-hooks/exhaustive-deps

    const { isSupportedImageType, fileName } = useMemo(() => {
      const imageFileRegex =
        /[^\s]+(.*?)\.(jpg|jpeg|png|gif|svg|webp|tif|tiff)(\?format=jpg)?$/gi
      let attachmentFileName = nodeAttrs.src

      if (nodeAttrs.contentType) {
        return {
          isSupportedImageType: nodeAttrs.contentType.startsWith('image/'),
          fileName: attachmentFileName,
        }
      }

      const imageExternalFile = {
        url: 'test',
      }

      if (imageExternalFile) {
        const imageExternalFileRef = getAttachments()?.find((file) => {
          if (imageExternalFile.url.includes('https://')) {
            return file.link === imageExternalFile.url
          } else {
            return file.id === imageExternalFile.url.replace('attachment:', '')
          }
        })

        if (imageExternalFileRef) {
          attachmentFileName = imageExternalFileRef.name
        }
      }

      return {
        isSupportedImageType: imageFileRegex.test(attachmentFileName),
        fileName: attachmentFileName,
      }
    }, [nodeAttrs.src, getAttachments]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (figure?.attrs?.externalFileReferences?.length) {
        figure?.attrs?.externalFileReferences?.map((exRef: ExternalFileRef) => {
          if (exRef && typeof exRef.ref === 'undefined') {
            const ref = getAttachments()?.find((file) => {
              // in the new implementation ExternalFileRef url will be attachment id LEAN-988
              if (exRef.url.includes('https://')) {
                return file.link === exRef.url
              } else {
                return file.id === exRef.url.replace('attachment:', '')
              }
            })
            exRef.ref = ref
            if (ref) {
              setFigureAttrs({
                externalFileReferences: [
                  // eslint-disable-next-line no-unsafe-optional-chaining
                  ...figure?.attrs.externalFileReferences,
                ],
              })
            }
          }
        })
      }
    }, [getAttachments]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (figure?.attrs?.externalFileReferences?.length && contentDOM) {
        figure?.attrs?.externalFileReferences?.map((exRef: ExternalFileRef) => {
          if (exRef) {
            const file = getAttachments()?.find((file) => {
              if (exRef.url.includes('https://')) {
                return file.link === exRef.url
              } else {
                return file.id === exRef.url.replace('attachment:', '')
              }
            })
            if (file) {
              contentDOM.setAttribute('id', file.id) // to allow focus in this node
            }
          }
        })
      }
    }, [contentDOM, figure?.attrs?.externalFileReferences])
    /* eslint-disable react-hooks/exhaustive-deps */

    const setFigureAttrs = useCallback(
      /* eslint-enable react-hooks/exhaustive-deps */
      setGivenNodeAttrs(figure, viewProps, dispatch, viewProps.getPos()),
      [figure, viewProps, dispatch]
    )

    const addFigureExFileRef = useCallback(
      (relation, publicUrl, attachmentId) => {
        if (figure) {
          setFigureAttrs({
            externalFileReferences: addExternalFileRef(
              figure?.attrs.externalFileReferences,
              `attachment:${attachmentId}`,
              relation
            ),
            src: publicUrl,
          })
        }
      },
      [figure, setFigureAttrs]
    )

    const { fileInputRef, onUploadClick } = useFileInputRef()

    return (
      <Container>
        {can?.editArticle && (
          <FileUpload
            fileInputRef={fileInputRef}
            uploadAttachment={uploadAttachment}
            addFigureExFileRef={addFigureExFileRef}
            accept={'image/*'}
            relation={'imageRepresentation'}
          />
        )}

        {src && src.length > 0 ? (
          isSupportedImageType ? (
            <UnstyledButton type="button" onClick={onUploadClick}>
              <OptionsDropdown
                url={src}
                submissionId={submissionId}
                onUploadClick={onUploadClick}
                setFigureAttrs={setFigureAttrs}
                getAttachments={getAttachments}
                modelMap={modelMap}
                mediaAlternativesEnabled={mediaAlternativesEnabled}
                canReplaceFile={can?.replaceFile}
                canDownloadFile={can?.downloadFiles}
                onDetachClick={() => {
                  console.log('Detach not implemented for Figure View')
                }}
              />

              <img
                id={nodeAttrs.id}
                src={src}
                alt={''}
                style={{ cursor: 'pointer' }}
              />
            </UnstyledButton>
          ) : (
            <UnstyledButton type="button" onClick={onUploadClick}>
              <Placeholder>
                <div>
                  <UnsupportedFormatIconWrapper>
                    <UnsupportedFormatFileIcon />
                  </UnsupportedFormatIconWrapper>
                  <div>{fileName}</div>
                  <UnsupportedFormatLabel>
                    Unsupported file format
                  </UnsupportedFormatLabel>
                  <div>
                    {can?.editArticle
                      ? 'Click to add image'
                      : 'No image here yet…'}
                  </div>
                </div>
              </Placeholder>
            </UnstyledButton>
          )
        ) : (
          <UnstyledButton type="button" onClick={onUploadClick}>
            <Placeholder>
              <div>
                {can?.editArticle ? 'Click to add image' : 'No image here yet…'}
              </div>
            </Placeholder>
          </UnstyledButton>
        )}
      </Container>
    )
  }

  return Component
}

const UnstyledButton = styled.button`
  display: block;
  border: none;
  background: none;
  margin-left: auto;
  margin-right: auto;
  min-width: 250px;
  padding: 0;
  position: relative;

  &:focus {
    outline: rgb(13, 121, 208) auto 1px;
  }
  img {
    max-width: 100%;
  }
  &:hover {
    .options-button {
      visibility: visible;
    }
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

const Container = styled.div`
  position: relative;
`

const UnsupportedFormatLabel = styled.div`
  font-size: 140%;
  line-height: 1.3;
  padding: 10px 0;
`

const UnsupportedFormatIconWrapper = styled.div`
  padding: 0 0 15px;
`

export default FigureComponent
