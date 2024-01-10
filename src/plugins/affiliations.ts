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
  AffiliationNode,
  ContributorNode,
  ManuscriptNode,
  isAffiliationNode,
  isContributorNode,
} from '@manuscripts/transform'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

interface PluginState {
  indexedAffiliationIds: Map<string, number> // key is authore id
  contributors: Array<[ContributorNode, number]>
  affiliations: Array<[AffiliationNode, number]>
}

export const affiliationsKey = new PluginKey<PluginState>('affiliations')

export const buildPluginState = (doc: ManuscriptNode): PluginState => {
  const contributors: Array<[ContributorNode, number]> = []
  const affiliations: Array<[AffiliationNode, number]> = []
  doc.descendants((node, pos) => {
    if (isAffiliationNode(node)) {
      affiliations.push([node, pos])
    }
    if (isContributorNode(node)) {
      contributors.push([node, pos])
    }
  })

  const iAffiliations = new Set<string>()

  contributors
    .map(([node]) => node)
    .sort((a, b) => {
      return Number(a.attrs.priority) - Number(b.attrs.priority)
    })
    .forEach((author) => {
      author.attrs.affiliations.forEach((aff) => {
        iAffiliations.add(aff)
      })
    })

  const indexedAffiliationIds = new Map<string, number>(
    [...iAffiliations].map((id, i) => [id, i + 1])
  )

  return {
    indexedAffiliationIds,
    contributors,
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
        return buildPluginState(newState.doc)
      },
    },

    // appendTransaction(transactions, oldState, newState) {
    //   const { tr } = newState
    //   return tr
    // },

    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        const { contributors, affiliations } = affiliationsKey.getState(
          state
        ) as PluginState

        const allNodes = [...contributors, ...affiliations]

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
