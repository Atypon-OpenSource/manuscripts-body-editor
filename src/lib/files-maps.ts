/*!
 * © 2023 Atypon Systems LLC
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

import { Model, ObjectTypes, Supplement } from '@manuscripts/json-schema'
import { FileAttachment } from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'

type FilePreApproved = (fileName: string) => boolean

export const getFigures = (
  doc: ProsemirrorNode,
  attachments: FileAttachment[]
): string[] => {
  const figures: string[] = []
  doc.descendants((node) => {
    if (node.type === schema.nodes.figure) {
      const ref = attachments.find((a) => node.attrs.src.startsWith(a.link))
      if (ref) {
        figures.push(ref.id)
      }
    }
  })
  return figures
}

// Get Supplement files from modelMap
export const getSupplementFiles = (
  modelMap: Map<string, Model>,
  attachments: FileAttachment[],
  isFilePreApproved?: FilePreApproved
) => {
  const supplements: Supplement[] = []
  for (const model of modelMap.values()) {
    if (model.objectType === ObjectTypes.Supplement) {
      supplements.push(model as Supplement)
    }
  }
  const supplementsMap = new Map(
    supplements.map((supplement) => [
      supplement.href?.replace('attachment:', ''),
      supplement,
    ])
  )

  return attachments.filter((attachment) => {
    if (supplementsMap.has(attachment.id) && isFilePreApproved) {
      return isFilePreApproved(attachment.name)
    } else {
      return supplementsMap.has(attachment.id)
    }
  })
}
// get other files = Attachments - Supplement files
export const getOtherFiles = (
  supplementFiles: FileAttachment[],
  attachments: FileAttachment[],
  isFilePreApproved?: FilePreApproved
) => {
  const excludedAttachmentsIds = new Set(
    [...supplementFiles].map((file) => file.id)
  )

  return attachments.filter((attachment) => {
    if (!excludedAttachmentsIds.has(attachment.id) && isFilePreApproved) {
      return isFilePreApproved(attachment.name)
    } else {
      return !excludedAttachmentsIds.has(attachment.id)
    }
  })
}
