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
import { Model } from '@manuscripts/manuscripts-json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import React, { SyntheticEvent } from 'react'

import { EditableBlockProps } from '../../views/editable_block'
import { SubmissionAttachment } from '../../views/figure_extended_editable'
import { OptionsDropdown } from './FilesDropdown'

interface Props {
  src: string
  submissionId: string
  onUploadClick: (e: SyntheticEvent | Event) => void
  externalFiles: SubmissionAttachment[]
  modelMap: Map<string, Model>
  mediaAlternativesEnabled: boolean
  setFigureAttrs: (attrs: { [p: string]: any }) => void // eslint-disable-line
  can: Capabilities
}
// ReactViewComponentProps
const FigureOptionsSubview: React.FC<EditableBlockProps & Props> = ({
  src,
  submissionId,
  onUploadClick,
  setFigureAttrs,
  externalFiles,
  modelMap,
  mediaAlternativesEnabled,
  can,
}) => {
  return (
    <OptionsDropdown
      url={src}
      submissionId={submissionId}
      onUploadClick={onUploadClick}
      setFigureAttrs={setFigureAttrs}
      externalFiles={externalFiles}
      modelMap={modelMap}
      mediaAlternativesEnabled={mediaAlternativesEnabled}
      canReplaceFile={can?.replaceFile}
      canDownloadFile={can?.downloadFiles}
    />
  )
}

export default FigureOptionsSubview
