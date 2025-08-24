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

import { ManuscriptEditorState, ManuscriptNode } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { getBibliographyPluginState } from '../bibliography'
import { footnotesKey } from '../footnotes'
import { objectsKey } from '../objects'
import { ValidatorContext, validators } from './validators'

export type Inconsistency = {
  type: 'warning'
  category: 'missing-reference' | 'empty-content'
  severity: 'error' | 'warning'
  message: string
  nodeDescription: string
  node: ManuscriptNode
  pos: number
}

export type PluginState = {
  decorations: DecorationSet
  inconsistencies: Array<Inconsistency>
  showDecorations: boolean
}

export const createDecoration = (
  node: ManuscriptNode,
  pos: number,
  selectedPos: number | null
) => {
  const classNames = ['inconsistency-highlight']
  if (selectedPos === pos) {
    classNames.push('selected-suggestion')
  }
  return Decoration.node(pos, pos + node.nodeSize, {
    class: classNames.join(' '),
    'data-inconsistency-type': 'warning',
  })
}

export const buildPluginState = (
  state: ManuscriptEditorState,
  props: EditorProps,
  showDecorations: boolean
): PluginState => {
  const inconsistencies: Inconsistency[] = []
  const decorations: Decoration[] = []

  const selection = state.selection
  let selectedPos: number | null = null

  if (selection instanceof NodeSelection) {
    selectedPos = selection.from
  }

  const context: ValidatorContext = {
    pluginStates: {
      bibliography: getBibliographyPluginState(state)?.bibliographyItems,
      objects: objectsKey.getState(state),
      footnotes: footnotesKey.getState(state)?.footnotesElementIDs,
    },
    showDecorations,
    selectedPos,
    decorations,
    props,
  }

  state.doc.descendants((node, pos) => {
    const validator = validators[node.type.name]
    if (validator) {
      inconsistencies.push(...validator(node, pos, context))
    }
  })

  return {
    decorations: DecorationSet.create(state.doc, decorations),
    inconsistencies,
    showDecorations,
  }
}
