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

import { NodeSelection } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'

import {
  accessibilityElementKey,
  expandAccessibilitySection,
} from '../accessibility_element'
import type { Inconsistency } from './types'

// Keep ProseMirror operations in the package that owns the editor view.
// The UI layer decides how to scroll the returned element.
export const selectInconsistency = (
  inconsistency: Inconsistency,
  view: EditorView
): HTMLElement | undefined => {
  const { pos } = inconsistency
  const { doc } = view.state
  if (pos < 0 || pos >= doc.content.size) {
    return
  }

  const node = doc.resolve(pos).nodeAfter
  // Ignore stale issues rather than selecting a replacement node at this position.
  if (!node || node.isText || !node.eq(inconsistency.node)) {
    return
  }

  // Figures and Figure Panels are nonselectable, but still need scrolling.
  if (NodeSelection.isSelectable(node)) {
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(doc, pos)))
  }
  const domNode = view.nodeDOM(pos)
  return domNode instanceof HTMLElement ? domNode : undefined
}

export const openAccessibilityFields = (
  inconsistency: Inconsistency,
  view: EditorView
): HTMLElement | undefined => {
  const element = selectInconsistency(inconsistency, view)
  const { pos, node } = inconsistency
  const { doc } = view.state
  if (pos < 0 || pos >= doc.content.size) {
    return element
  }

  const current = doc.resolve(pos).nodeAfter
  if (!current || current.isText || !current.eq(node)) {
    return element
  }

  const tr = view.state.tr
  expandAccessibilitySection(tr, current)
  if (tr.getMeta(accessibilityElementKey)) {
    view.dispatch(tr)
  }

  const input = element?.querySelector('.accessibility_element_input')
  if (input instanceof HTMLElement) {
    input.focus()
  }
  return element
}
