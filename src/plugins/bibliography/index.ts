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

import { buildCitationNodes, buildCitations } from '@manuscripts/library'
import { isEqual } from 'lodash-es'
import { NodeSelection, Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { buildDecorations, getBibliographyItemFn } from './bibliography-utils'
import { BibliographyProps, CiteProcCitation, PluginState } from './types'

import { CitationProvider, loadCitationStyle } from '@manuscripts/library'
import { DEFAULT_BUNDLE } from '@manuscripts/transform'

import { BibliographyItem, Citation } from '@manuscripts/json-schema'

export const bibliographyKey = new PluginKey('bibliography')

/**
 * This plugin generates labels for inline citations using citeproc-js.
 * The citation labels are regenerated when any relevant content changes.
 */
export default async (props: BibliographyProps) => {
  const getBibliographyItem = getBibliographyItemFn(props)

  const styleOpts = { bundleID: DEFAULT_BUNDLE }
  const citationStyle = await loadCitationStyle(styleOpts)
  // const createCitation = (
  //   citations: BibliographyItem[],
  //   citation: Citation
  // ) => {
  //   const citationText = CitationProvider.makeCitationCluster(
  //     citations,
  //     citation,
  //     citationStyle
  //   )

  //   return citationText !== '[NO_PRINTED_FORM]' ? citationText : ''
  // }

  const rebuildCitations = (
    citations: CiteProcCitation[],
    bibliographyItems: BibliographyItem[]
  ) => {
    const generatedCitations = CitationProvider.rebuildCitations(
      citations,
      bibliographyItems,
      citationStyle
    )

    return generatedCitations
  }

  const getBibliographyItems = () => {
    const bibliographyItems: BibliographyItem[] = []
    props.modelMap?.forEach((value) => {
      if (value.objectType === 'MPBibliographyItem') {
        bibliographyItems.push(value as BibliographyItem)
      }
    })

    return bibliographyItems
  }

  return new Plugin<PluginState>({
    key: bibliographyKey,
    state: {
      init(config, instance): PluginState {
        const citationNodes = buildCitationNodes(instance.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(id)
        )

        return {
          citationNodes,
          citations,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const citationNodes = buildCitationNodes(newState.doc, props.getModel)

        const citations = buildCitations(citationNodes, (id: string) =>
          getBibliographyItem(id)
        )
        // TODO: return the previous state if nothing has changed, to aid comparison?

        return {
          citationNodes,
          citations,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      // const nodeModel = props.getModel(this.node.attrs.rid)
      // let citationText = ''
      // try {
      //   citationText = createCitation(citations, nodeModel as Citation)
      // } catch (e) {
      //   citationText = this.node.attrs.contents
      // }

      // const fragment = sanitize(citationText, {
      //   ALLOWED_TAGS: ['i', 'b', 'span', 'sup', 'sub', '#text'],
      // })

      // const citationProvider = props.getCitationProvider()

      // if (!citationProvider) {
      //   return null
      // }

      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citationNodes, citations } = bibliographyKey.getState(
        newState
      ) as PluginState

      const bibliographyInserted = transactions.some((tr) => {
        const meta = tr.getMeta(bibliographyKey)
        return meta && meta.bibliographyInserted
      })
      // This equality is trigged by such things as the addition of createdAt, updatedAt,
      // sessionID, _rev when the models are simply persisted to the PouchDB without modifications
      if (isEqual(citations, oldCitations) && !bibliographyInserted) {
        return null
      }
      const { tr } = newState
      const { selection } = tr

      try {
        const generatedCitations = rebuildCitations(
          citations,
          getBibliographyItems()
        ).map((item) => item[2]) // id, noteIndex, output

        citationNodes.forEach(([node, pos], index) => {
          let contents = generatedCitations[index]

          if (contents === '[NO_PRINTED_FORM]') {
            contents = ''
          }

          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            contents,
          })
        })

        // create a new NodeSelection
        // as selection.map(tr.doc, tr.mapping) loses the NodeSelection
        if (selection instanceof NodeSelection) {
          tr.setSelection(NodeSelection.create(tr.doc, selection.from))
        }
        tr.setMeta('origin', bibliographyKey)
        return tr
      } catch (error) {
        console.error(error) // tslint:disable-line:no-console
      }
    },
    props: {
      decorations(state) {
        const { citationNodes } = bibliographyKey.getState(state)
        return DecorationSet.create(
          state.doc,
          buildDecorations(state.doc, citationNodes, getBibliographyItem)
        )
      },
    },
  })
}
