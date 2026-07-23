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

import {
  BibliographyItemAttrs,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import { Attrs } from 'prosemirror-model'
import { NodeSelection } from 'prosemirror-state'
import * as utils from 'prosemirror-utils'

import { isHidden } from './track-changes-utils'
import { sanitizeAttrsChange } from '@manuscripts/track-changes-plugin'

const metaNodeTypes = [
  schema.nodes.bibliography_item,
  schema.nodes.affiliation,
  schema.nodes.contributor,
]

const updateMetaNode = 'track-changes-update-meta-node'

export const findChildByID = (
  view: ManuscriptEditorView,
  id: string
): utils.NodeWithPos | undefined => {
  const doc = view.state.doc
  const children = utils.findChildren(doc, (n) => n.attrs.id === id)
  return children.length ? children[0] : undefined
}

export const findChildByType = (
  view: ManuscriptEditorView,
  type: ManuscriptNodeType
): utils.NodeWithPos | undefined => {
  const children = findChildrenByType(view, type)
  return children.length ? children[0] : undefined
}

export const findChildrenByType = (
  view: ManuscriptEditorView,
  type: ManuscriptNodeType
): utils.NodeWithPos[] => {
  const doc = view.state.doc
  return utils.findChildrenByType(doc, type).filter((n) => !isHidden(n.node))
}

export const findChildrenAttrsByType = <T extends Attrs>(
  view: ManuscriptEditorView,
  type: ManuscriptNodeType
): T[] => {
  return findChildrenByType(view, type).map((n) => n.node.attrs) as T[]
}

export const updateNodeAttrs = (
  view: ManuscriptEditorView,
  type: ManuscriptNodeType,
  attrs: Attrs
) => {
  const child = findChildByID(view, attrs.id)
  if (child) {
    const copy = sanitizeAttrsChange(attrs, child.node.attrs)
    // @ts-ignore attrs readonly - deleting from a copy
    delete copy.dataTracked
    const pos = child.pos
    const tr = view.state.tr
    tr.setNodeMarkup(pos, undefined, copy).setSelection(
      NodeSelection.create(tr.doc, pos)
    )
    if (metaNodeTypes.includes(type)) {
      tr.setMeta(updateMetaNode, true)
    }
    view.dispatch(tr)
    return true
  }
  return false
}

export const deleteNode = (view: ManuscriptEditorView, id: string) => {
  const child = findChildByID(view, id)
  if (child) {
    const pos = child.pos
    const node = child.node
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize))
  }
}

const createBibliographySection = (node: ManuscriptNode) =>
  schema.nodes.bibliography_section.createAndFill({}, [
    schema.nodes.section_title.create({}, schema.text('References')),
    schema.nodes.bibliography_element.create({}, node ? [node] : []),
  ]) as ManuscriptNode

export const insertBibliographyItem = (
  view: ManuscriptEditorView,
  attrs: BibliographyItemAttrs
) => {
  const { doc, tr } = view.state

  const biblioSection = utils.findChildrenByType(
    doc,
    schema.nodes.bibliography_element,
    true
  )

  const backmatter = utils.findChildrenByType(
    doc,
    schema.nodes.backmatter,
    true
  )
  const backmatterEnd = backmatter[0]
    ? backmatter[0].node.nodeSize + backmatter[0].pos
    : 0

  const node = schema.nodes.bibliography_item.create(attrs)

  if (biblioSection.length) {
    view.dispatch(tr.insert(biblioSection[0].pos + 1, node))
  } else {
    view.dispatch(
      tr.insert(
        backmatterEnd ? backmatterEnd - 1 : tr.doc.content.size,
        createBibliographySection(node)
      )
    )
  }
}

export const saveBibliographyItem = (
  view: ManuscriptEditorView,
  attrs: BibliographyItemAttrs
) => {
  if (findChildByID(view, attrs.id)) {
    updateNodeAttrs(view, schema.nodes.bibliography_item, attrs)
  } else {
    insertBibliographyItem(view, attrs)
  }
}
