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

import { isDeleted } from '@manuscripts/track-changes-plugin'
import { findMatchingCategory, schema } from '@manuscripts/transform'
import { NodeSelection } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import type { EditorView } from 'prosemirror-view'

import {
  insertAbstractSection,
  insertBackmatterSection,
  insertKeywords,
} from '../../commands'
import { openAuthorsAndAffiliationsModals } from '../../components/authors-affiliations/AuthorsAndAffiliationsModals'
import { openInsertAwardModal } from '../../components/awards/AwardModal'
import { getTextOfType } from '../../lib/utils'
import { getEditorProps } from '../editor-props'
import { getValidationCategory } from './configured-validators'
import { toEnabledValidations } from './inconsistency'
import { inconsistencyDefinitions } from './inconsistency-definitions'
import type { MetadataTab } from './types'

const scrollToNode = (view: EditorView, pos: number) => {
  const node = view.state.doc.nodeAt(pos)
  if (!node || !NodeSelection.isSelectable(node)) {
    return
  }
  view.focus()
  view.dispatch(
    view.state.tr
      .setSelection(NodeSelection.create(view.state.doc, pos))
      .scrollIntoView()
  )
}

const openAbstract = (view: EditorView) => {
  const categories = getEditorProps(view.state)?.sectionCategories
  insertAbstractSection(categories?.get('abstract'))(
    view.state,
    view.dispatch,
    view
  )
}

const openKeywords = (view: EditorView) => {
  const existing = findChildrenByType(view.state.doc, schema.nodes.keywords)[0]
  if (existing) {
    scrollToNode(view, existing.pos)
    return
  }
  insertKeywords(view.state, view.dispatch, view)
}

const backmatterTabs = {
  'conflict-of-interest': 'missing-conflict-of-interest',
  'data-availability': 'missing-data-availability',
  'ethics-statement': 'missing-ethics-statement',
} as const satisfies Record<string, keyof typeof inconsistencyDefinitions>

const openBackmatterSection = (
  view: EditorView,
  tab: keyof typeof backmatterTabs
) => {
  const props = getEditorProps(view.state)
  const category = getValidationCategory(
    toEnabledValidations(props?.getValidations?.() ?? props?.validations),
    props?.sectionCategories,
    backmatterTabs[tab]
  )
  if (!category) {
    return
  }
  const backmatter = findChildrenByType(
    view.state.doc,
    schema.nodes.backmatter
  )[0]
  const existing = backmatter
    ? findChildrenByType(backmatter.node, schema.nodes.section).find(
        (section) =>
          !isDeleted(section.node) &&
          findMatchingCategory(
            [category],
            section.node.attrs.category,
            getTextOfType(section.node, schema.nodes.section_title)
          )
      )
    : undefined
  if (backmatter && existing) {
    scrollToNode(view, backmatter.pos + 1 + existing.pos)
    return
  }
  insertBackmatterSection(category)(view.state, view.dispatch, view)
}

export const openMetadataTarget = (
  pos: number,
  view: EditorView | undefined,
  tab: MetadataTab,
  options?: { addNew?: boolean }
) => {
  if (!view) {
    return
  }
  if (tab === 'authors' || tab === 'affiliations') {
    openAuthorsAndAffiliationsModals(pos, view, tab, options)
    return
  }
  if (tab === 'abstract') {
    openAbstract(view)
    return
  }
  if (tab === 'keywords') {
    openKeywords(view)
    return
  }
  if (tab in backmatterTabs) {
    openBackmatterSection(view, tab as keyof typeof backmatterTabs)
    return
  }
  openInsertAwardModal(view)
}
