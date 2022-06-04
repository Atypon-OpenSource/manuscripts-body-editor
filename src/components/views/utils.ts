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

import { Model } from '@manuscripts/manuscripts-json-schema'
import {
  extensionsWithFileTypesMap,
  fileTypesWithIconMap,
  getSupplementFiles,
  inlineFiles,
} from '@manuscripts/style-guide'

import { SubmissionAttachment } from '../../views/FigureComponent'

export const getIcon = (file: SubmissionAttachment) => {
  const fileExtension = file.name.split('.').pop() || ''
  const fileType = extensionsWithFileTypesMap.get(fileExtension.toLowerCase())
  return fileTypesWithIconMap.get(fileType)
}

export const getFileType = (fileName: string) => {
  const fileExtension = fileName.split('.').pop() || ''
  return extensionsWithFileTypesMap.get(fileExtension.toLowerCase())
}

export const getSupplements = (
  modelMap: Map<string, Model>,
  externalFiles: SubmissionAttachment[],
  hasFileType: (fileName: string) => boolean
) =>
  getSupplementFiles(modelMap, externalFiles).filter(({ name }) =>
    hasFileType(name)
  ) as SubmissionAttachment[]

export const getOtherFiles = (
  modelMap: Map<string, Model>,
  externalFiles: SubmissionAttachment[],
  hasFileType: (fileName: string) => boolean
) => {
  const attachmentsIds = getAttachmentsIds(modelMap, externalFiles)
  return externalFiles.filter(
    ({ id, name }) => !attachmentsIds.has(id) && hasFileType(name)
  )
}

/**
 * This Set of AttachmentsIds for both inlineFiles and supplement
 * that will not be shown in other files
 */
const getAttachmentsIds = (
  modelMap: Map<string, Model>,
  externalFiles?: SubmissionAttachment[]
) => {
  const attachmentsIDs = new Set<string>()
  if (externalFiles) {
    inlineFiles(modelMap, externalFiles).map(({ attachments }) => {
      if (attachments) {
        attachments.map((attachment) => attachmentsIDs.add(attachment.id))
      }
    })
    getSupplementFiles(modelMap, externalFiles).map(({ id }) =>
      attachmentsIDs.add(id)
    )
  }
  return attachmentsIDs
}
