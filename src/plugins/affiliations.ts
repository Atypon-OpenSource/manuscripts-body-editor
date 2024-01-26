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
 * It also provides that information to components that display that indexing.
 */
import {
  AffiliationNode,
  ContributorNode,
  isAffiliationNode,
  isContributorNode,
  ManuscriptNode,
} from '@manuscripts/transform'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { getActualAttrs, isDeleted } from '../lib/track-changes-utils'

interface PluginState {
  indexedAffiliationIds: Map<string, number> // key is authore id
  contributors: Map<string, [ContributorNode, number]>
  affiliations: Array<[AffiliationNode, number]>
}

export const affiliationsKey = new PluginKey<PluginState>('affiliations')

export const buildPluginState = (doc: ManuscriptNode): PluginState => {
  const contributors: Array<[ContributorNode, number]> = []
  const affiliations: Array<[AffiliationNode, number]> = []

  doc.descendants((node, pos) => {
    if (isDeleted(node)) {
      return
    }
    if (isAffiliationNode(node)) {
      affiliations.push([node, pos])
    }
    if (isContributorNode(node)) {
      contributors.push([node, pos])
    }
  })

  const iAffiliations = new Set<string>()

  contributors
    .sort(([a], [b]) => {
      return (
        Number(getActualAttrs(a).priority) - Number(getActualAttrs(b).priority)
      )
    })
    .forEach(([author]) => {
      getActualAttrs(author).affiliations.forEach((aff) => {
        iAffiliations.add(aff)
      })
    })

  const indexedAffiliationIds = new Map<string, number>(
    [...iAffiliations].map((id, i) => [id, i + 1])
  )

  return {
    indexedAffiliationIds,
    contributors: contributors.reduce((acc, [node, pos]) => {
      acc.set(node.attrs.id, [node, pos])
      return acc
    }, new Map() as Map<string, [ContributorNode, number]>),
    affiliations,
  }
}

let count = 0

export default () => {
  return new Plugin<PluginState>({
    key: affiliationsKey,

    state: {
      init(config, instance): PluginState {
        return buildPluginState(instance.doc)
      },

      apply(tr, value, oldState, newState): PluginState {
        const prevPluginState = affiliationsKey.getState(oldState)
        if (!tr.docChanged && prevPluginState) {
          return prevPluginState
        } else {
          return buildPluginState(newState.doc)
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const { affiliations, indexedAffiliationIds } = affiliationsKey.getState(
        newState
      ) as PluginState

      const oldPluginState = affiliationsKey.getState(oldState) as PluginState

      const orphanAffiliations: [AffiliationNode, number][] = []

      const { tr } = newState

      for (const [id] of oldPluginState.indexedAffiliationIds.entries()) {
        if (!indexedAffiliationIds.has(id)) {
          const affiliation = affiliations.find(
            ([node]) => node.attrs.id === id
          )
          if (affiliation) {
            orphanAffiliations.push(affiliation)
            tr.delete(affiliation[1], affiliation[1] + affiliation[0].nodeSize)
          }
        }
      }

      return tr
    },

    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []
        const allNodes: Array<[ProsemirrorNode, number]> = []

        state.doc.descendants((node, pos) => {
          if (isAffiliationNode(node) || isContributorNode(node)) {
            allNodes.push([node, pos])
          }
        })

        if (allNodes.length) {
          allNodes.forEach(([node, pos]) => {
            decorations.push(
              Decoration.node(
                pos,
                pos + node.nodeSize,
                {},
                {
                  refresh: count++,
                }
              )
            )
          })
        }

        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
