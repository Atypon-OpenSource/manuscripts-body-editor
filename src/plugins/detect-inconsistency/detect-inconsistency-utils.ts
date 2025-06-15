/*!
 * © 2025 Atypon Systems LLC
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
  ManuscriptEditorState,
  ManuscriptNode,
  nodeNames,
  schema,
} from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { getBibliographyPluginState } from '../bibliography'
import { footnotesKey } from '../footnotes'
import { objectsKey } from '../objects'

export type Warning = {
  type: 'warning'
  category: 'missing-reference' | 'empty-content'
  severity: 'error' | 'warning'
  message: string
  node: ManuscriptNode
  pos: number
}

export type PluginState = {
  decorations: DecorationSet
  warnings: Array<Warning>
  showDecorations: boolean
}

export const createDecoration = (
  node: ManuscriptNode,
  pos: number,
  selectedPos: number | null
) => {
  const classNames = ['warning-highlight']
  if (selectedPos === pos) {
    classNames.push('selected-suggestion')
  }
  return Decoration.node(pos, pos + node.nodeSize, {
    class: classNames.join(' '),
    'data-inconsistency-type': 'warning',
  })
}

export const getNodeDescription = (node: ManuscriptNode): string => {
  const nodeType = nodeNames.get(node.type) || node.type?.name
  const nodeText = node.textContent?.trim().slice(0, 30)
  return nodeText
    ? `${nodeType} "${nodeText}${nodeText.length > 30 ? '...' : ''}"`
    : nodeType
}

export const addWarning = (
  warnings: Warning[],
  decorations: Decoration[],
  node: ManuscriptNode,
  pos: number,
  category: Warning['category'],
  severity: Warning['severity'],
  message: string,
  showDecorations: boolean,
  selectedPos: number | null
) => {
  warnings.push({
    type: 'warning',
    category,
    severity,
    message,
    node,
    pos,
  })
  showDecorations && decorations.push(createDecoration(node, pos, selectedPos))
}

export const buildPluginState = (
  state: ManuscriptEditorState,
  showDecorations: boolean
): PluginState => {
  const warnings: Warning[] = []
  const decorations: Decoration[] = []

  try {
    const selection = state.selection
    let selectedPos: number | null = null

    if (selection instanceof NodeSelection) {
      selectedPos = selection.from
    }

    const pluginStates = {
      bibliography: getBibliographyPluginState(state)?.bibliographyItems,
      objects: objectsKey.getState(state),
      footnotes: footnotesKey.getState(state),
    }

    state.doc.descendants((node, pos) => {
      if (node.type === schema.nodes.title && node.type.name === 'title') {
        const isEmpty = node.content.size === 0
        if (isEmpty) {
          addWarning(
            warnings,
            decorations,
            node,
            pos,
            'empty-content',
            'warning',
            `${getNodeDescription(node)} is empty`,
            showDecorations,
            selectedPos
          )
        }
      } else if (node.attrs && node.attrs.rids) {
        if (node.type === schema.nodes.cross_reference) {
          const figures = Array.from(pluginStates.objects?.keys() ?? [])

          const isInFigures = node.attrs.rids.every((rid: string) =>
            figures.includes(rid)
          )
          if (!isInFigures) {
            addWarning(
              warnings,
              decorations,
              node,
              pos,
              'missing-reference',
              'warning',
              `${getNodeDescription(node)} has no linked reference`,
              showDecorations,
              selectedPos
            )
          }
        } else if (node.type === schema.nodes.citation) {
          if (pluginStates.bibliography) {
            const bibliographyItem = node.attrs.rids.every((rid: string) =>
              pluginStates.bibliography?.get(rid)
            )
            if (!bibliographyItem) {
              addWarning(
                warnings,
                decorations,
                node,
                pos,
                'missing-reference',
                'warning',
                `${getNodeDescription(node)} has no linked reference`,
                showDecorations,
                selectedPos
              )
            }
          }
        } else if (node.type === schema.nodes.inline_footnote) {
          if (pluginStates.footnotes) {
            const footnoteElement = node.attrs.rids.every((rid: string) =>
              pluginStates.footnotes?.footnotesElementIDs.get(rid)
            )
            if (!footnoteElement) {
              addWarning(
                warnings,
                decorations,
                node,
                pos,
                'missing-reference',
                'warning',
                `${getNodeDescription(node)} has no linked reference`,
                showDecorations,
                selectedPos
              )
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error building inconsistency plugin state:', error)
    return {
      decorations: DecorationSet.empty,
      warnings: [],
      showDecorations: false,
    }
  }

  return {
    decorations: DecorationSet.create(state.doc, decorations),
    warnings,
    showDecorations,
  }
}
