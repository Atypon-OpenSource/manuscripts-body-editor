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

import { BibliographyItem, ObjectTypes } from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'
import {
  CitationNode,
  isCitationNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import CiteProc from 'citeproc'
import { isEqual, pickBy } from 'lodash'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import { DecorationSet } from 'prosemirror-view'

import { CSLProps } from '../../configs/ManuscriptsEditor'
import { PopperManager } from '../../lib/popper'
import { BibliographyItemAttrs } from '../../lib/references'
import { isHidden } from '../../lib/track-changes-utils'
import {
  buildCitations,
  buildDecorations,
  CitationNodes,
} from './bibliography-utils'

export const bibliographyKey = new PluginKey<PluginState>('bibliography')

export interface PluginState {
  version: string
  citationNodes: CitationNodes
  citations: CiteProc.Citation[]
  bibliographyItems: Map<string, BibliographyItemAttrs>
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
  doc.descendants((node, pos) => {
    if (isCitationNode(node)) {
      nodesMap.set(node.attrs.id, [node, pos])
    }
  })

  const nodes = Array.from(nodesMap.values())
  const bibliographyItems = getBibliographyItemAttrs(doc)
  const citations = buildCitations(nodes)

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
      getLibraryItem: (id: string) =>
        getBibliographyItem(bibliographyItems.get(id)),
      citationStyle: csl.style || '',
      locale: csl.locale,
    })

    //create new citations since CitationProvider modifies the ones passed
    const citationTexts = provider.rebuildState(buildCitations(nodes))

    $new.version = String(version++)
    $new.citationCounts = citationCounts
    $new.provider = provider
    $new.renderedCitations = new Map(citationTexts.map((i) => [i[0], i[2]]))
  }

  return $new as PluginState
}

const getBibliographyItem = (
  attrs: BibliographyItemAttrs | undefined
): BibliographyItem | undefined => {
  if (!attrs) {
    return
  }

  const { id, ...rest } = attrs
  const item = {
    _id: id,
    objectType: ObjectTypes.BibliographyItem,
    ...rest,
  } as BibliographyItem
  return pickBy(item, (v) => v !== undefined) as BibliographyItem
}

const getBibliographyItemAttrs = (doc: ManuscriptNode) => {
  const attrs = new Map<string, BibliographyItemAttrs>()
  findChildrenByType(doc, schema.nodes.bibliography_item)
    .filter((n) => !isHidden(n.node))
    .map((n) => n.node.attrs as BibliographyItemAttrs)
    .forEach((a) => attrs.set(a.id, a))
  return attrs
}

export const getBibliographyPluginState = (state: EditorState) => {
  return bibliographyKey.getState(state)
}
