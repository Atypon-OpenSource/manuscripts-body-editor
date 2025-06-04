/*!
 * © 2024 Atypon Systems LLC
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
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { findChildrenByType } from 'prosemirror-utils'

import { isHidden } from './track-changes-utils'

export type FileAttachment = {
  id: string
  name: string
  createdDate?: Date
}

export type NodeFile = {
  node: ManuscriptNode
  pos: number
  file: FileAttachment
}

export type ElementFiles = {
  node: ManuscriptNode
  pos: number
  files: NodeFile[]
}

export type ManuscriptFiles = {
  figures: ElementFiles[]
  supplements: NodeFile[]
  attachments: NodeFile[]
  others: FileAttachment[]
}

const MISSING_FILE: FileAttachment = {
  id: '',
  name: '',
}

export type Upload = (file: File) => Promise<FileAttachment>

export type Download = (file: FileAttachment) => void

export type PreviewLink = (file: FileAttachment) => string | undefined

export type FileManagement = {
  upload: Upload
  download: Download
  previewLink: PreviewLink
}

const figureTypes = [
  schema.nodes.figure_element,
  schema.nodes.image_element,
  schema.nodes.hero_image,
]

export const groupFiles = (
  doc: ManuscriptNode,
  files: FileAttachment[]
): ManuscriptFiles => {
  const fileMap = new Map(files.map((f) => [f.id, f]))
  const figures: ElementFiles[] = []
  const supplements: NodeFile[] = []
  const attachments: NodeFile[] = []

  const getFile = (href: string) => {
    const file = fileMap.get(href)
    if (file) {
      fileMap.delete(href)
      return file
    } else {
      return MISSING_FILE
    }
  }

  const getFigureElementFiles = (node: ManuscriptNode, pos: number) => {
    const figureFiles = []
    for (const figure of findChildrenByType(node, schema.nodes.figure)) {
      if (isHidden(figure.node)) {
        continue
      }
      figureFiles.push({
        node: figure.node,
        pos: pos + figure.pos + 1,
        file: getFile(figure.node.attrs.src),
      })
    }
    return {
      node,
      pos,
      files: figureFiles,
    }
  }

  doc.descendants((node, pos) => {
    if (isHidden(node)) {
      return
    }
    if (figureTypes.includes(node.type)) {
      figures.push(getFigureElementFiles(node, pos))
    }
    if (node.type === schema.nodes.supplement) {
      supplements.push({
        node,
        pos,
        file: getFile(node.attrs.href),
      })
    }
    if (node.type === schema.nodes.attachment) {
      attachments.push({
        node,
        pos,
        file: getFile(node.attrs.href),
      })
    }
  })

  return {
    figures,
    supplements,
    attachments,
    others: [...fileMap.values()],
  }
}
