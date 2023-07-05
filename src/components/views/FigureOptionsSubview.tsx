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
import { Capabilities, FileAttachment } from '@manuscripts/style-guide'
import React, { SyntheticEvent } from 'react'

import { EditableBlockProps } from '../../views/editable_block'
import { OptionsDropdown } from './FilesDropdown'

export interface FigureOptionsSubviewProps {
  src: string
  onUploadClick: (e: SyntheticEvent | Event) => void
  onDetachClick: () => void
  getAttachments: () => FileAttachment[]
  modelMap: Map<string, Model>
  mediaAlternativesEnabled: boolean
  setFigureAttrs: (attrs: { [p: string]: any }) => void // eslint-disable-line
  can: Capabilities
  disabled: boolean
}
// ReactViewComponentProps
const FigureOptionsSubview: React.FC<
  EditableBlockProps & FigureOptionsSubviewProps
> = ({
  src,
  onUploadClick,
  onDetachClick,
  setFigureAttrs,
  getAttachments,
  modelMap,
  mediaAlternativesEnabled,
  can,
  disabled,
}) => {
  return (
    <OptionsDropdown
      url={src}
      disabled={disabled}
      onUploadClick={onUploadClick}
      setFigureAttrs={setFigureAttrs}
      getAttachments={getAttachments}
      modelMap={modelMap}
      onDetachClick={onDetachClick}
      mediaAlternativesEnabled={mediaAlternativesEnabled}
      canReplaceFile={can?.replaceFile}
      canDownloadFile={can?.downloadFiles}
      canEditArticle={can?.editArticle}
    />
  )
}

export default FigureOptionsSubview
