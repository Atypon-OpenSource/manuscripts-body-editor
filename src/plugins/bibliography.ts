import {
  BibliographyItem,
  Citation,
  CitationItem,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import { isEqual } from 'lodash-es'
import { Plugin, PluginKey } from 'prosemirror-state'
import { getChildOfType } from '../lib/utils'
import { CitationNode, isCitationNode } from '../schema/nodes/citation'
import {
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '../schema/types'

type NodesWithPositions = Array<[CitationNode, number]>

interface PluginState {
  citationNodes: NodesWithPositions
  citations: Citeproc.CitationByIndex
}

const needsBibliographySection = (
  hadBibliographySection: boolean,
  hasBibliographySection: boolean,
  oldCitations: Citeproc.CitationByIndex,
  citations: Citeproc.CitationByIndex
) => {
  if (hasBibliographySection) return false // not if already exists
  if (hadBibliographySection) return false // not if being deleted
  if (citations.length === 0) return false //  not if no citations

  return oldCitations.length === 0 // only when creating the first citation
}

const needsUpdate = (
  hadBibliographySection: boolean,
  hasBibliographySection: boolean,
  oldCitations: Citeproc.CitationByIndex,
  citations: Citeproc.CitationByIndex
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
  ) as ManuscriptNode

export const bibliographyKey = new PluginKey('bibliography')

interface Props {
  getCitationProcessor: () => Citeproc.Processor
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
}

export default (props: Props) => {
  const buildCitationNodes = (
    state: ManuscriptEditorState
  ): NodesWithPositions => {
    let citationNodes: NodesWithPositions = []

    state.doc.descendants((node, pos) => {
      if (isCitationNode(node)) {
        citationNodes.push([node, pos])
      }
    })

    // TODO: handle missing objects?
    // https://gitlab.com/mpapp-private/manuscripts-frontend/issues/395
    citationNodes = citationNodes.filter(
      ([node]) =>
        node.attrs.rid &&
        node.attrs.rid !== 'null' &&
        props.getModel<Citation>(node.attrs.rid)
    )

    return citationNodes
  }

  const buildCitations = (
    citationNodes: NodesWithPositions
  ): Citeproc.CitationByIndex =>
    citationNodes
      .map(([node]) => props.getModel<Citation>(node.attrs.rid)!)
      .map((citation: Citation) => ({
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

  return new Plugin<ManuscriptSchema>({
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

      const citationProcessor = props.getCitationProcessor()

      const generatedCitations = citationProcessor
        .rebuildProcessorState(citations)
        .map(item => item[2]) // id, noteIndex, output

      let tr = newState.tr

      citationNodes.forEach(([node, pos], index) => {
        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          contents: generatedCitations[index],
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
        tr = tr.insert(tr.doc.content.size, createBibliographySection(newState))
      }

      // generate the bibliography
      const bibliography = citationProcessor.makeBibliography()

      if (bibliography) {
        const [
          bibmeta,
          generatedBibliographyItems,
        ] = bibliography as Citeproc.Bibliography

        if (bibmeta.bibliography_errors.length) {
          console.warn(bibmeta.bibliography_errors) // tslint:disable-line:no-console
        }

        tr.doc.descendants((node, pos) => {
          if (node.type.name === 'bibliography_element') {
            const contents = generatedBibliographyItems.length
              ? `<div class="csl-bib-body">${generatedBibliographyItems.join(
                  '\n'
                )}</div>`
              : `<div class="csl-bib-body empty-node" data-placeholder="${
                  node.attrs.placeholder
                }"></div>`

            tr = tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              contents,
            })
          }
        })
      }

      return tr.setSelection(newState.selection).setMeta('addToHistory', false)
    },
  })
}
