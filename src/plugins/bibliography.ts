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
  CitationNode,
  isCitationNode,
  ManuscriptEditorState,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Citation,
  CitationItem,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'
import { isEqual } from 'lodash-es'
import { Plugin, PluginKey } from 'prosemirror-state'
import { getChildOfType } from '..'

type CitationNodes = Array<[CitationNode, number, Citation]>

interface PluginState {
  citationNodes: CitationNodes
  citations: CiteProc.Citation[]
}

const needsBibliographySection = (
  hadBibliographySection: boolean,
  hasBibliographySection: boolean,
  oldCitations: CiteProc.Citation[],
  citations: CiteProc.Citation[]
) => {
  if (hasBibliographySection) return false // not if already exists
  if (hadBibliographySection) return false // not if being deleted
  if (citations.length === 0) return false //  not if no citations

  return oldCitations.length === 0 // only when creating the first citation
}

const needsUpdate = (
  hadBibliographySection: boolean,
  hasBibliographySection: boolean,
  oldCitations: CiteProc.Citation[],
  citations: CiteProc.Citation[]
) =>
  hadBibliographySection !== hasBibliographySection ||
  !isEqual(citations, oldCitations)

const createBibliographySection = (state: ManuscriptEditorState) =>
  state.schema.nodes.bibliography_section.createAndFill(
    {},
    state.schema.nodes.section_title.create(
      {},
      state.schema.text('Bibliography')
    )
  )

export const bibliographyKey = new PluginKey('bibliography')

interface Props {
  getCitationProcessor: () => CiteProc.Engine | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
}

export default (props: Props) => {
  const buildCitationNodes = (state: ManuscriptEditorState): CitationNodes => {
    const citationNodes: CitationNodes = []

    state.doc.descendants((node, pos) => {
      if (isCitationNode(node)) {
        const citation = props.getModel<Citation>(node.attrs.rid)

        if (citation) {
          citationNodes.push([node, pos, citation])
        }
      }
    })

    return citationNodes
  }

  const buildCitations = (citationNodes: CitationNodes): CiteProc.Citation[] =>
    citationNodes.map(([node, pos, citation]) => ({
      citationID: citation._id,
      citationItems: citation.embeddedCitationItems.map(
        (citationItem: CitationItem) => ({
          id: citationItem.bibliographyItem,
          data: props.getLibraryItem(citationItem.bibliographyItem), // for comparison
        })
      ),
      properties: { noteIndex: 0 },
      manuscript: props.getManuscript(), // for comparison
    }))

  return new Plugin<PluginState, ManuscriptSchema>({
    key: bibliographyKey,
    state: {
      init(config, instance): PluginState {
        const citationNodes = buildCitationNodes(instance)
        const citations = buildCitations(citationNodes)

        return {
          citationNodes,
          citations,
        }
      },

      apply(tr, value, oldState, newState): PluginState {
        const citationNodes = buildCitationNodes(newState)
        const citations = buildCitations(citationNodes)

        return {
          citationNodes,
          citations,
        }
      },
    },

    appendTransaction(transactions, oldState, newState) {
      const citationProcessor = props.getCitationProcessor()

      if (!citationProcessor) {
        return null
      }

      // TODO: use setMeta to notify of updates when the doc hasn't changed?
      // if (!transactions.some(transaction => transaction.docChanged)) {
      //   return null
      // }

      const { citations: oldCitations } = bibliographyKey.getState(
        oldState
      ) as PluginState

      const { citationNodes, citations } = bibliographyKey.getState(
        newState
      ) as PluginState

      const hadBibliographySection = getChildOfType(
        oldState.tr.doc,
        oldState.schema.nodes.bibliography_section
      )

      const hasBibliographySection = getChildOfType(
        newState.tr.doc,
        newState.schema.nodes.bibliography_section
      )

      if (
        !needsUpdate(
          hadBibliographySection,
          hasBibliographySection,
          oldCitations,
          citations
        )
      ) {
        return null
      }

      // TODO: move this into a web worker and/or make it asynchronous?

      const generatedCitations = citationProcessor
        .rebuildProcessorState(citations)
        .map(item => item[2]) // id, noteIndex, output

      const tr = newState.tr

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

      if (
        needsBibliographySection(
          hadBibliographySection,
          hasBibliographySection,
          oldCitations,
          citations
        )
      ) {
        tr.insert(tr.doc.content.size, createBibliographySection(newState)!)
      }

      // generate the bibliography
      const bibliography = citationProcessor.makeBibliography()

      if (bibliography) {
        const [bibmeta, generatedBibliographyItems] = bibliography

        if (bibmeta.bibliography_errors.length) {
          console.warn(bibmeta.bibliography_errors) // tslint:disable-line:no-console
        }

        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'bibliography_element') {
            const contents = generatedBibliographyItems.length
              ? `<div class="csl-bib-body" id="${
                  node.attrs.id
                }">${generatedBibliographyItems.join('\n')}</div>`
              : `<div class="csl-bib-body empty-node" data-placeholder="${node.attrs.placeholder}"></div>`

            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              contents,
            })
          }
        })
      }

      return tr.setSelection(newState.selection)
    },
  })
}
