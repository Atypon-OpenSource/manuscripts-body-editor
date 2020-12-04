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
import React, { SyntheticEvent, useRef, useState } from 'react'
import styled from 'styled-components'

import { ReactViewComponentProps } from './ReactView'

export interface FigureProps {
  putAttachment: (file: File) => Promise<string>
  permissions: { write: boolean }
}

const Figure = ({ putAttachment, permissions }: FigureProps) => {
  const Component: React.FC<ReactViewComponentProps<FigureNode>> = ({
    nodeAttrs,
    setNodeAttrs,
  }) => {
    const [displayUrl, setDisplayUrl] = useState<string>(nodeAttrs.src || '')
    const fileInput = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: SyntheticEvent) => {
      e.preventDefault()

      const file =
        fileInput.current &&
        fileInput.current.files &&
        fileInput.current.files[0]

      if (!file || !permissions.write) {
        return
      }

      setDisplayUrl(window.URL.createObjectURL(file))

      const url = await putAttachment(file)

      setNodeAttrs({
        contentType: file.type,
        // TODO: MPExternalFile
        src: url,
      })
    }

    const handleImageClick = (e: SyntheticEvent) => {
      e.preventDefault()

      if (!permissions.write || !fileInput.current) {
        return
      }

      fileInput.current.click()
    }

    return (
      <React.Fragment>
        {permissions.write && (
          <HiddenInput
            type="file"
            ref={fileInput}
            onChange={handleUpload}
            accept="image/*"
          />
        )}

        {displayUrl ? (
          <UnstyledButton type="button" onClick={handleImageClick}>
            <img
              src={displayUrl}
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
      </React.Fragment>
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

export default Figure
