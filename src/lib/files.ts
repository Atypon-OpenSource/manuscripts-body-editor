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

import { findGraphicalAbstractFigureElement } from './doc'
import { isHidden } from './track-changes-utils'

export type FileDesignation = {
  id: string
}

export type FileAttachment = {
  id: string
  name: string
  type: FileDesignation
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
  others: FileAttachment[]
  mainDocument: NodeFile[]
}

const MISSING_FILE: FileAttachment = {
  id: '',
  name: 'Missing file',
  type: {
    id: 'missing',
  },
}

export type Upload = (file: File) => Promise<FileAttachment>

export type Download = (file: FileAttachment) => void

export type PreviewLink = (file: FileAttachment) => string | undefined

export type FileManagement = {
  upload: Upload
  download: Download
  previewLink: PreviewLink
}

export const groupFiles = (
  doc: ManuscriptNode,
  files: FileAttachment[]
): ManuscriptFiles => {
  const fileMap = new Map(files.map((f) => [f.id, f]))
  const figures: ElementFiles[] = []
  const supplements: NodeFile[] = []
  const mainDocument: NodeFile[] = []
  const getFigureElementFiles = (node: ManuscriptNode, pos: number) => {
    const figureFiles = []
    for (const figure of findChildrenByType(node, schema.nodes.figure)) {
      if (isHidden(figure.node)) {
        continue
      }
      const src = figure.node.attrs.src
      if (!src) {
        continue
      }
      let file = fileMap.get(src)
      if (file) {
        fileMap.delete(src)
      } else {
        file = MISSING_FILE
      }
      figureFiles.push({
        node: figure.node,
        pos: pos + figure.pos + 1,
        file,
      })
    }
    return {
      node,
      pos,
      files: figureFiles,
    }
  }

  let gaID: string
  const element = findGraphicalAbstractFigureElement(doc)
  if (element) {
    gaID = element.node.attrs.id
    figures.push(getFigureElementFiles(element.node, element.pos))
  }

  doc.descendants((node, pos) => {
    if (
      (node.type === schema.nodes.figure_element ||
        node.type === schema.nodes.image_element) &&
      node.attrs.id !== gaID
    ) {
      figures.push(getFigureElementFiles(node, pos))
    }

    if (node.type === schema.nodes.supplement) {
      if (isHidden(node)) {
        return
      }
      const href = node.attrs.href
      let file = fileMap.get(href)
      if (file) {
        fileMap.delete(href)
      } else {
        file = MISSING_FILE
      }
      supplements.push({
        node,
        pos,
        file,
      })
    }
    if (node.type === schema.nodes.attachment) {
      if (isHidden(node)) {
        return
      }
      const href = node.attrs.href
      let file = fileMap.get(href)
      if (file) {
        fileMap.delete(href)
      } else {
        file = MISSING_FILE
      }
      mainDocument.push({
        node,
        pos,
        file,
      })
    }
  })

  return {
    figures,
    supplements,
    others: [...fileMap.values()],
    mainDocument,
  }
}
