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
  BibliographyItemAttrs,
  buildCiteprocCitation,
  CitationNode,
  isBibliographyElementNode,
  isBibliographyItemNode,
  isCitationNode,
  ManuscriptNode,
} from '@manuscripts/transform'
import * as Citeproc from 'citeproc'
import { isEqual } from 'lodash'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { CSLProps } from '../configs/ManuscriptsEditor'
import { PopperManager } from '../lib/popper'
import { visibleDescendants } from '../lib/utils'

export const bibliographyKey = new PluginKey<PluginState>('bibliography')

export interface PluginState {
  version: string
  citationNodes: [CitationNode, number][]
  citations: Citeproc.Citation[]
  bibliographyItems: Map<string, BibliographyItemAttrs>
  renderedCitations: Map<string, string>
  citationCounts: Map<string, number>
  engine: Citeproc.Engine
}

export interface BibliographyProps {
  cslProps: CSLProps
  popper: PopperManager
}

/**
 * This plugin generates labels for inline citations using citeproc-js.
 * The citation labels are regenerated when any relevant content changes.
 */
export default (props: BibliographyProps) => {
  return new Plugin<PluginState>({
    key: bibliographyKey,
    state: {
      init(config, instance): PluginState {
        return buildBibliographyPluginState(instance.doc, props.cslProps)
      },
      apply(tr, value): PluginState {
        if (!tr.steps.length) {
          return value
        }
        return buildBibliographyPluginState(tr.doc, props.cslProps, value)
      },
    },
    props: {
      decorations(state) {
        const bib = getBibliographyPluginState(state)

        return DecorationSet.create(
          state.doc,
          bib ? buildDecorations(bib, state.doc) : []
        )
      },
    },
  })
}

let version = 1
const buildBibliographyPluginState = (
  doc: ManuscriptNode,
  csl: CSLProps,
  $old?: PluginState
): PluginState => {
  const nodesMap = new Map<string, [CitationNode, number]>()
  const bibliographyItems = new Map<string, BibliographyItemAttrs>()
  visibleDescendants(doc, (node, pos) => {
    if (isCitationNode(node)) {
      nodesMap.set(node.attrs.id, [node, pos])
    }
    if (isBibliographyItemNode(node)) {
      bibliographyItems.set(node.attrs.id, node.attrs)
    }
  })

  const nodes = Array.from(nodesMap.values())
  const citations = nodes.map(([node]) => buildCiteprocCitation(node.attrs))

  const $new: Partial<PluginState> = {
    citationNodes: nodes,
    citations,
    bibliographyItems,
  }

  //TODO remove. There should always be a csl style
  if (!csl.style) {
    return $new as PluginState
  }

  if (
    $old &&
    isEqual(citations, $old.citations) &&
    isEqual(bibliographyItems, $old.bibliographyItems)
  ) {
    $new.version = $old.version
    $new.citationCounts = $old.citationCounts
    $new.engine = $old.engine
    $new.renderedCitations = $old.renderedCitations
  } else {
    const citationCounts = new Map()
    const rids = nodes.flatMap((e) => e[0].attrs.rids)
    rids.forEach((rid) => {
      const count = citationCounts.get(rid) || 0
      citationCounts.set(rid, count + 1)
    })

    const engine = new Citeproc.Engine(
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        retrieveLocale: () => csl.locale!,
        retrieveItem: (id: string) => {
          const item = bibliographyItems.get(id)
          if (!item) {
            throw Error(`Missing bibliography item with id ${id}`)
          }
          return item as CSL.Data
        },
      },
      csl.style,
      'en-US'
    )

    //create new citations since citeproc modifies the ones passed
    const citationTexts = engine.rebuildProcessorState(
      nodes.map(([node]) => buildCiteprocCitation(node.attrs))
    )

    $new.version = String(version++)
    $new.citationCounts = citationCounts
    $new.engine = engine
    $new.renderedCitations = new Map(citationTexts.map((i) => [i[0], i[2]]))
  }

  return $new as PluginState
}

export const buildDecorations = (state: PluginState, doc: ManuscriptNode) => {
  const decorations: Decoration[] = []

  let hasMissingItems = false

  for (const [node, pos] of state.citationNodes) {
    const rids = node.attrs.rids
    if (rids.length) {
      for (const rid of rids) {
        if (!state.bibliographyItems.has(rid)) {
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
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        version: state.version,
      })
    )
  }

  if (hasMissingItems) {
    doc.descendants((node, pos) => {
      if (isBibliographyElementNode(node)) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            missing: 'true',
          })
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

  /**
   * Use decorations to trigger bibliography element update.
   * This is a way to communicate from the plugin to the bibliography element node without actually changing the node.
   * We had to do that due to the absence of an actual node change.
   * @TODO Look for a neater solution (using non-trackable attributes on bibliography_element is a proposed solution)
   */
  doc.descendants((node, pos) => {
    if (isBibliographyElementNode(node)) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          version: state.version,
        })
      )
    }
  })

  return decorations
}

export const getBibliographyPluginState = (state: EditorState) => {
  return bibliographyKey.getState(state)
}
