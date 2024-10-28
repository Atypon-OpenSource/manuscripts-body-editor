/*!
 * © 2024 Atypon Systems LLC
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
import { SectionCategory } from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { buildPluginState } from './section-category-utils'

export const sectionCategoryKey = new PluginKey<PluginState>('section-category')

export interface PluginState {
  decorations: DecorationSet
}

export interface SectionCategoryProps extends EditorProps {
  sectionCategories: Map<string, SectionCategory>
}

export default (props: SectionCategoryProps) =>
  new Plugin<PluginState>({
    key: sectionCategoryKey,
    state: {
      init: (_, state) => buildPluginState(state, props),
      apply: (tr, value, oldState, newState) =>
        buildPluginState(newState, props),
    },
    props: {
      decorations: (state) =>
        sectionCategoryKey.getState(state)?.decorations || DecorationSet.empty,
    },
  })
