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
import { Model } from '@manuscripts/json-schema'
import {
  Decoder,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
} from '@manuscripts/transform'
import * as utils from 'prosemirror-utils'

import { isMetaNode } from './utils'

const decoder = new Decoder(new Map())

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
  return utils.findChildrenByType(doc, type)
}

export const updateNode = (
  view: ManuscriptEditorView,
  node: ManuscriptNode
) => {
  const child = findChildByID(view, node.attrs.id)
  if (child) {
    const pos = child.pos
    const tr = view.state.tr.setNodeMarkup(pos, undefined, node.attrs)
    if (isMetaNode(node.type.name)) {
      tr.setMeta('track-changes-update-meta-node', true)
    }
    view.dispatch(tr)
  }
}

export const deleteNode = (view: ManuscriptEditorView, id: string) => {
  const child = findChildByID(view, id)
  if (child) {
    const pos = child.pos
    const node = child.node
    view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize))
  }
}

export const decode = (model: Model): ManuscriptNode => {
  return decoder.decode(model) as ManuscriptNode
}
