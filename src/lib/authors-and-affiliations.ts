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

import {
  generateNodeID,
  ManuscriptEditorView,
  ManuscriptNodeType,
  schema,
} from '@manuscripts/transform'
import { Attrs } from 'prosemirror-model'

import { AffiliationAttrs, ContributorAttrs } from './authors'
import { findInsertionPosition } from './utils'
import { findChildByType, updateNodeAttrs } from './view'

function insertNode(
  parentType: ManuscriptNodeType,
  childType: ManuscriptNodeType
) {
  return (view: ManuscriptEditorView, attrs: Attrs) => {
    const parent = findChildByType(view, parentType)
    let tr = view.state.tr

    if (parent) {
      tr = tr.insert(parent.pos + 1, childType.create(attrs))
    } else {
      const insertPos = findInsertionPosition(parentType, view.state.doc)
      const wrapper = parentType.create({
        id: generateNodeID(parentType),
      })
      tr = tr
        .insert(insertPos, wrapper)
        .insert(insertPos + 1, childType.create(attrs))
    }

    view.dispatch(tr)
  }
}

function upsertNode<T extends Attrs>(
  nodeType: ManuscriptNodeType,
  insertFn: (view: ManuscriptEditorView, attrs: T) => void
) {
  return (view: ManuscriptEditorView, attrs: T) => {
    if (!updateNodeAttrs(view, nodeType, attrs)) {
      insertFn(view, attrs)
    }
  }
}

const insertAuthorNode = insertNode(
  schema.nodes.contributors,
  schema.nodes.contributor
)
const insertAffiliationNode = insertNode(
  schema.nodes.affiliations,
  schema.nodes.affiliation
)

export const upsertAuthor = upsertNode<ContributorAttrs>(
  schema.nodes.contributor,
  insertAuthorNode
)

export const upsertAffiliation = upsertNode<AffiliationAttrs>(
  schema.nodes.affiliation,
  insertAffiliationNode
)
