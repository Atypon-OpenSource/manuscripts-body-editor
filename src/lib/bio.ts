/*!
 * © 2026 Atypon Systems LLC
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

import { getActualTextContent } from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import { NodeSelection, Transaction } from 'prosemirror-state'

import { findChildByID } from './view'

export const BIO_TEXT_MAX_LENGTH = 500

/**
 * Plain representation of the `bio` form values in authors modal:
 * the text of its first paragraph and the id
 * of the file used as the bio image.
 */
export interface BioValues {
  text: string
  image: string
}

export const emptyBio: BioValues = { text: '', image: '' }

export const hasBio = (bio: BioValues) => !!(bio.text.trim() || bio.image)

const findChild = (node: ManuscriptNode, type: ManuscriptNodeType) => {
  let found: { node: ManuscriptNode; offset: number } | undefined
  node.forEach((child, offset) => {
    if (!found && child.type === type) {
      found = { node: child, offset }
    }
  })
  return found
}

export const getBio = (contributor: ManuscriptNode): BioValues => {
  const bio = findChild(contributor, schema.nodes.bio)?.node
  if (!bio) {
    return emptyBio
  }
  const paragraph = findChild(bio, schema.nodes.paragraph)?.node
  const image = findChild(bio, schema.nodes.image_element)?.node
  const figure = image && findChild(image, schema.nodes.figure)?.node
  
  return {
    text: paragraph ? getActualTextContent(paragraph.content) : '',
    image: figure?.attrs.src || '',
  }
}

const updateText = (tr: Transaction, pos: number, text: string) => {
  const paragraph = tr.doc.nodeAt(pos)
  if (!paragraph) {
    return
  }
  const from = pos + 1;
  const to = pos + paragraph.nodeSize - 1;
  if (!text) { // cant replace with emtpy - tr.replaceWith will throw with empty
    tr.delete(from, to)
    return
  }
  tr.replaceWith(
    from,
    to,
    schema.text(
      text
    )
  )
}

const createImage = (src: string) =>
  schema.nodes.image_element.createAndFill(
    {
      id: generateNodeID(schema.nodes.image_element),
    },
    schema.nodes.figure.create({ src })
  ) as ManuscriptNode

const createParagraph = (text: string) =>
  schema.nodes.paragraph.create(
    {
      id: generateNodeID(schema.nodes.paragraph),
    },
    text ? schema.text(text) : undefined
  )

const createBio = (values: BioValues) =>
  schema.nodes.bio.create(
    {
      id: generateNodeID(schema.nodes.bio),
    },
    [
      ...(values.image ? [createImage(values.image)] : []),
      createParagraph(values.text),
    ]
  )

/**
 * The image is detached by resetting the file reference (as for the figures),
 * the nodes are kept in place.
 */
const updateImage = (tr: Transaction, pos: number, src: string) => {
  const bio = tr.doc.nodeAt(pos)
  if (!bio) {
    return
  }
  const image = findChild(bio, schema.nodes.image_element)
  if (!image) {
    if (src) {
      tr.insert(pos + 1, createImage(src))
    }
    return
  }
  const imagePos = pos + 1 + image.offset
  const figure = findChild(image.node, schema.nodes.figure)
  if (!figure) {
    if (src) {
      tr.insert(imagePos + 1, schema.nodes.figure.create({ src }))
    }
    return
  }
  if (figure.node.attrs.src !== src) {
    tr.setNodeMarkup(imagePos + 1 + figure.offset, undefined, {
      ...figure.node.attrs,
      src,
    })
  }
}

/**
 * Writes the values to the `bio` node of the contributor. Only the text of the
 * first paragraph and the image are changed, any other content of the bio is
 * kept as it is.
 */
export const saveBio = (
  view: ManuscriptEditorView,
  contributorID: string,
  values: BioValues
) => {
  const contributor = findChildByID(view, contributorID)
  if (!contributor || contributor.node.type !== schema.nodes.contributor) {
    return false
  }
  const tr = view.state.tr
  const bio = findChild(contributor.node, schema.nodes.bio)
  if (!bio) {
    if (!!(values.text.trim() || values.image)) {
      tr.insert(contributor.pos + 1, createBio(values))
    }
  } else {
    const pos = contributor.pos + 1 + bio.offset
    // the steps have to follow the order of the document (the image precedes
    // the paragraph), otherwise they are not tracked correctly
    updateImage(tr, pos, values.image)
    const node = tr.doc.nodeAt(pos) as ManuscriptNode
    const paragraph = findChild(node, schema.nodes.paragraph)
    if (paragraph) {
      updateText(tr, pos + 1 + paragraph.offset, values.text)
    } else if (values.text) {
      tr.insert(pos + node.nodeSize - 1, createParagraph(values.text))
    }
  }
  if (!tr.docChanged) {
    return false
  }
  tr.setSelection(NodeSelection.create(tr.doc, contributor.pos))
  view.dispatch(tr)
  return true
}
