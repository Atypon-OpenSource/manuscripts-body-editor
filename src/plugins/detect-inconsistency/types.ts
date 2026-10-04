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

import {
  BibliographyItemAttrs,
  ManuscriptNode,
  Target,
} from '@manuscripts/transform'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { FootnotesElementState } from '../footnotes'

export type MetadataTab =
  | 'authors'
  | 'affiliations'
  | 'abstract'
  | 'keywords'
  | 'funder'
  | 'conflict-of-interest'
  | 'data-availability'
  | 'ethics-statement'

export type InconsistencyAction =
  | { type: 'navigate-to-node' }
  | { type: 'open-accessibility' }
  | { type: 'open-metadata'; tab: MetadataTab }
  | { type: 'open-files'; tab: 'main-document' }

export type Inconsistency = {
  type: 'warning'
  category: 'missing-reference' | 'not-used' | 'empty-content' | 'duplicate'
  severity: 'error' | 'warning'
  title?: string
  action?: InconsistencyAction
  message: string
  nodeDescription: string
  node: ManuscriptNode
  pos: number
}

export type PluginState = {
  decorations: DecorationSet
  inconsistencies: Array<Inconsistency>
  showDecorations: boolean
  validationKey: string
}

export type ValidatorContext = {
  pluginStates: {
    affiliations: Map<string, number> | undefined
    bibliography: Map<string, BibliographyItemAttrs> | undefined
    objects: Map<string, Target> | undefined
    footnotes: Map<string, string> | undefined
    footnotesElements: Map<string, FootnotesElementState> | undefined
  }
  showDecorations: boolean
  selectedPos: number | null
  decorations: Decoration[]
  props: EditorProps
  doc: ManuscriptNode
  enabledValidations: Map<string, Inconsistency['severity']>
}

export type NodeValidator = (
  node: ManuscriptNode,
  pos: number,
  context: ValidatorContext
) => Inconsistency[]
