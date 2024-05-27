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

/**
 * This plugin handles indexing of affiliations that are supposed to be index in accordance with their order in the document.
 * It also provides that information to components that display that indexing. Additionally it deletes affiliations that have been detached and not used anymore.
 */
import {
  AffiliationNode,
  isAffiliationNode,
  isContributorNode,
  ManuscriptNode,
} from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import {
  AffiliationAttrs,
  authorComparator,
  ContributorAttrs,
} from '../lib/authors'
import {
  getActualAttrs,
  isDeleted,
  isPendingInsert,
} from '../lib/track-changes-utils'

export interface PluginState {
  version: string
  indexedAffiliationIds: Map<string, number> // key is affiliation id
  contributors: ContributorAttrs[]
  affiliations: AffiliationAttrs[]
  decorations: DecorationSet
}

export const affiliationsKey = new PluginKey<PluginState>('affiliations')

let id = 1
export const buildPluginState = (
  doc: ManuscriptNode,
  $old?: PluginState
): PluginState => {
  const nodes: [ManuscriptNode, number][] = []
  const contributors: ContributorAttrs[] = []
  const affiliations: AffiliationAttrs[] = []

  doc.descendants((node, pos) => {
    const attrs = isDeleted(node) ? node.attrs : getActualAttrs(node)
    if (isAffiliationNode(node)) {
      nodes.push([node, pos])
      affiliations.push(attrs as AffiliationAttrs)
    }
    if (isContributorNode(node)) {
      nodes.push([node, pos])
      contributors.push(attrs as ContributorAttrs)
    }
  })

  if (
    $old &&
    isEqual(contributors, $old.contributors) &&
    isEqual(affiliations, $old.affiliations)
  ) {
    return $old
  }

  const iAffiliations = new Set<string>()

  contributors.sort(authorComparator).forEach((attrs) => {
    attrs.affiliations.forEach((aff) => {
      iAffiliations.add(aff)
    })
  })

  const indexedAffiliationIds = new Map<string, number>(
    [...iAffiliations].map((id, i) => [id, i + 1])
  )

  const version = String(id++)
  const decorations: Decoration[] = []
  nodes.forEach(([node, pos]) => {
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        version,
      })
    )
  })

  return {
    version,
    indexedAffiliationIds,
    contributors,
    affiliations,
    decorations: DecorationSet.create(doc, decorations),
  }
}

export default () => {
  return new Plugin<PluginState>({
    key: affiliationsKey,

    state: {
      init(config, instance): PluginState {
        return buildPluginState(instance.doc)
      },

      apply(tr, value, oldState, newState): PluginState {
        const $old = affiliationsKey.getState(oldState)
        if (!tr.docChanged && $old) {
          return $old
        } else {
          return buildPluginState(newState.doc, $old)
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const affs = affiliationsKey.getState(newState)
      if (!affs || !transactions.find((tr) => tr.docChanged)) {
        return
      }
      const $old = affiliationsKey.getState(oldState) as PluginState

      const affiliations = new Map<string, [AffiliationNode, number]>()
      newState.doc.descendants((node, pos) => {
        if (isAffiliationNode(node)) {
          affiliations.set(node.attrs.id, [node, pos])
        }
      })

      const deleteIDs = []

      for (const [id] of $old.indexedAffiliationIds.entries()) {
        if (!affs.indexedAffiliationIds.has(id)) {
          deleteIDs.push(id)
        }
      }

      if (!deleteIDs.length) {
        return
      }

      const tr = newState.tr
      tr.setMeta('origin', 'affiliations')

      for (const id of deleteIDs) {
        const affiliation = affiliations.get(id)
        if (!affiliation) {
          continue
        }
        const [node, pos] = affiliation
        if (node && !isPendingInsert(node)) {
          tr.delete(pos, pos + node.nodeSize)
        }
      }

      return tr
    },

    props: {
      decorations: (state) => affiliationsKey.getState(state)?.decorations,
    },
  })
}
