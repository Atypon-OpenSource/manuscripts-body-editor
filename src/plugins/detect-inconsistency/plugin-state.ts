/*!
 * © 2026 Atypon Systems LLC
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
import { affiliationsKey } from '../affiliations'
import { getBibliographyPluginState } from '../bibliography'
import { footnotesKey } from '../footnotes'
import { objectsKey } from '../objects'
import { toEnabledValidations, validationKey } from './issue'
import type { Inconsistency, PluginState, ValidatorContext } from './types'
import { validators } from './validators'

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
      affiliations: affiliationsKey.getState(state)?.indexedAffiliationIds,
      bibliography: getBibliographyPluginState(state)?.bibliographyItems,
      objects: objectsKey.getState(state),
      footnotes: footnotesKey.getState(state)?.footnotesElementIDs,
      footnotesElements: footnotesKey.getState(state)?.footnotesElements,
    },
    showDecorations,
    selectedPos,
    decorations,
    props,
    doc: state.doc,
    enabledValidations: toEnabledValidations(
      props.getValidations?.() ?? props.validations
    ),
  }

  const collect = (node: ManuscriptNode, pos: number) => {
    const validator = validators[node.type.name]
    if (validator) {
      inconsistencies.push(...validator(node, pos, context))
    }
  }
  collect(state.doc, 0)
  state.doc.descendants(collect)

  return {
    decorations: DecorationSet.create(state.doc, decorations),
    inconsistencies,
    showDecorations,
    validationKey: validationKey(props.getValidations?.() ?? props.validations),
  }
}
