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
  Designation,
  designationWithFileSectionsMap,
  extensionsWithFileTypesMap,
  FileSectionType,
  FileType,
  fileTypesWithIconMap,
  namesWithDesignationMap,
} from '@manuscripts/style-guide'

import { SubmissionAttachment } from '../../views/FigureComponent'
import { ExternalFileIcon } from './FilesDropdown'

export const getIcon = (file: SubmissionAttachment) => {
  const fileExtension = file.name.split('.').pop() || ''
  const fileType = extensionsWithFileTypesMap.get(fileExtension.toLowerCase())
  return fileTypesWithIconMap.get(fileType)
}

const getDesignationSectionType = (
  designation: Designation,
  fileType?: FileType,
  mediaAlternativesEnabled?: boolean
) => {
  if (mediaAlternativesEnabled) {
    // TODO:: specify file type for media Alternatives
    return designationWithFileSectionsMap.get(designation)
  } else {
    return (
      fileType === FileType.Image &&
      designationWithFileSectionsMap.get(designation)
    )
  }
}

export const getPaperClipButtonFiles = (
  externalFiles?: SubmissionAttachment[],
  mediaAlternativesEnabled?: boolean
) => {
  const files: {
    supplements: ExternalFileIcon[]
    otherFiles: ExternalFileIcon[]
  } = {
    supplements: [],
    otherFiles: [],
  }

  externalFiles?.map((file) => {
    const designation = namesWithDesignationMap.get(file.type.label)
    const fileExtension = file.name.split('.').pop() || ''
    const fileType = extensionsWithFileTypesMap.get(fileExtension.toLowerCase())

    if (designation !== undefined) {
      switch (
        getDesignationSectionType(
          designation,
          fileType,
          mediaAlternativesEnabled
        )
      ) {
        case FileSectionType.Supplements:
          files.supplements.push({
            ...file,
            icon: fileTypesWithIconMap.get(fileType),
          })
          break
        case FileSectionType.OtherFile:
          files.otherFiles.push({
            ...file,
            icon: fileTypesWithIconMap.get(fileType),
          })
          break
      }
    }
  })
  return files
}

export const getOtherFiles = (
  externalFiles?: SubmissionAttachment[],
  mediaAlternativesEnabled?: boolean
) =>
  (externalFiles &&
    externalFiles.filter((file) => {
      const designation = namesWithDesignationMap.get(file.type.label)
      const fileExtension = file.name.split('.').pop() || ''
      const fileType = extensionsWithFileTypesMap.get(
        fileExtension.toLowerCase()
      )
      if (designation !== undefined) {
        const sectionType = getDesignationSectionType(
          designation,
          fileType,
          mediaAlternativesEnabled
        )
        return sectionType === FileSectionType.OtherFile
      }
    })) ||
  []
