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

import { BibliographyItem } from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'
import { isCitationNode, ManuscriptNode } from '@manuscripts/transform'
import CiteProc from 'citeproc'
import { isEqual } from 'lodash'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { CSLProps } from '../../configs/ManuscriptsEditor'
import { PopperManager } from '../../lib/popper'
import { isRejectedInsert } from '../../lib/track-changes-utils'
import {
  buildCitations,
  buildDecorations,
  CitationNodes,
  getBibliographyItemModelMap,
} from './bibliography-utils'

export const bibliographyKey = new PluginKey<PluginState>('bibliography')

export interface PluginState {
  citationNodes: CitationNodes
  citations: CiteProc.Citation[]
  bibliographyItems: Map<string, BibliographyItem>
  renderedCitations: Map<string, string>
  citationCounts: Map<string, number>
  provider: CitationProvider
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
        return DecorationSet.create(state.doc, buildDecorations(bib, state.doc))
      },
    },
  })
}

const buildBibliographyPluginState = (
  doc: ManuscriptNode,
  csl: CSLProps,
  $old?: PluginState
): PluginState => {
  const nodes: CitationNodes = []
  doc.descendants((node, pos) => {
    if (isCitationNode(node) && !isRejectedInsert(node)) {
      nodes.push([node, pos])
    }
  })

  const bibliographyItemMap = getBibliographyItemModelMap(doc)

  const citations = buildCitations(nodes)

  const $new: Partial<PluginState> = {
    citationNodes: nodes,
    citations,
    bibliographyItems: bibliographyItemMap,
  }

  //TODO remove. There should always be a csl style
  if (!csl.style) {
    return $new as PluginState
  }

  if (
    $old &&
    isEqual(citations, $old.citations) &&
    isEqual(modelMap, $old.bibliographyItems)
  ) {
    $new.citationCounts = $old.citationCounts
    $new.provider = $old.provider
    $new.renderedCitations = $old.renderedCitations
  } else {
    const citationCounts = new Map()
    const rids = nodes.flatMap((e) => e[0].attrs.rids)
    rids.forEach((rid) => {
      const count = citationCounts.get(rid) || 0
      citationCounts.set(rid, count + 1)
    })

    const provider = new CitationProvider({
      getLibraryItem: (id: string) => bibliographyItemMap.get(id),
      citationStyle: csl.style || '',
      locale: csl.locale,
    })

    //create new citations since CitationProvider modifies the ones passed
    const citationTexts = provider.rebuildState(buildCitations(nodes))

    $new.citationCounts = citationCounts
    $new.provider = provider
    $new.renderedCitations = new Map(citationTexts.map((i) => [i[0], i[2]]))
  }

  return $new as PluginState
}

export const getBibliographyPluginState = (state: EditorState) => {
  return bibliographyKey.getState(state) as PluginState
}
