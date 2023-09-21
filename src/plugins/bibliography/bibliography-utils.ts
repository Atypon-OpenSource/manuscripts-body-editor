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

import {
  BibliographyItem,
  Citation,
  Model,
  ObjectTypes,
} from '@manuscripts/json-schema'
import { CitationNodes } from '@manuscripts/library'
import {
  CHANGE_OPERATION,
  CHANGE_STATUS,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptNode, schema } from '@manuscripts/transform'
import { pickBy } from 'lodash-es'
import { Attrs, NodeType } from 'prosemirror-model'
import { Decoration } from 'prosemirror-view'

export const isBibliographyElement = (node: ManuscriptNode) =>
  node.type === node.type.schema.nodes.bibliography_element

export const buildDecorations = (
  doc: ManuscriptNode,
  citationNodes: CitationNodes,
  referencesModelMap: Map<string, Model>
) => {
  const decorations: Decoration[] = []

  let hasMissingItems = false

  for (const [node, pos, citation] of citationNodes) {
    if (citation.embeddedCitationItems.length) {
      for (const citationItem of citation.embeddedCitationItems) {
        if (!referencesModelMap.get(citationItem.bibliographyItem)) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: 'citation-missing',
            })
          )

          hasMissingItems = true
        }
      }
    } else {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'citation-empty',
        })
      )
    }
  }

  if (hasMissingItems) {
    doc.descendants((node, pos) => {
      if (isBibliographyElement(node)) {
        decorations.push(
          Decoration.node(
            pos,
            pos + node.nodeSize,
            {},
            {
              missing: true,
            }
          )
        )

        decorations.push(
          Decoration.widget(pos, () => {
            const el = document.createElement('div')
            el.className = 'bibliography-missing'
            el.textContent = `The bibliography could not be generated, due to a missing library item.`
            return el
          })
        )
      }
    })
  }

  return decorations
}

const cleanData = <T extends Model>(model: T) =>
  pickBy(model, (value) => value !== undefined) as T

/**
 * Map PM node(bibliography, citation) to Model and it could be map by dataTracked if it's exist
 * as it's easier to deal with the manuscript Models for both references list & citation popup view
 */
export const getNodeModel = <T extends Model>(node: ManuscriptNode): T => {
  const getLatest = (a: TrackedAttrs, b: TrackedAttrs) =>
    a.updatedAt > b.updatedAt ? a : b
  const mapNodeToModel = (attrs: Attrs, nodeType: NodeType): T => {
    if (nodeType === schema.nodes.bibliography_item) {
      const { id, containerTitle, doi, ...rest } = attrs
      return cleanData<T>({
        _id: id,
        'container-title': containerTitle,
        DOI: doi,
        ...rest,
        objectType: ObjectTypes.BibliographyItem,
      } as Partial<BibliographyItem> as T)
    }

    const { rid, embeddedCitationItems } = attrs
    return {
      _id: rid,
      embeddedCitationItems:
        embeddedCitationItems?.map(
          (item: { id: string; bibliographyItem: string }) => ({
            _id: item.id,
            bibliographyItem: item.bibliographyItem,
            objectType: ObjectTypes.CitationItem,
          })
        ) || [],
      objectType: ObjectTypes.Citation,
    } as Partial<Citation> as T
  }

  const { dataTracked, ...attrs } = node.attrs
  const nodeChange = (dataTracked as TrackedAttrs[] | undefined)?.reduce(
    getLatest
  )
  const isRejected =
    nodeChange &&
    nodeChange.operation === CHANGE_OPERATION.set_node_attributes &&
    nodeChange.status === CHANGE_STATUS.rejected

  return mapNodeToModel(isRejected ? nodeChange?.oldAttrs : attrs, node.type)
}

/**
 * Return model map that are built primarily from PM document
 */
export const getReferencesModelMap = (doc: ManuscriptNode) => {
  const modelMap = new Map<string, Model>()
  doc.descendants((node) => {
    if (
      node.type === schema.nodes.bibliography_item ||
      node.type === schema.nodes.citation
    ) {
      const model = getNodeModel(node)
      if (model) {
        modelMap.set(model._id, model)
      }
    }
  })

  return modelMap
}
