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
import { ArrowDownCircleIcon, ExpanderButton } from '@manuscripts/style-guide'
import { schema } from '@manuscripts/transform'
import { findChildren } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'

import { EditorProps } from '../../configs/ManuscriptsEditor'
import { getInsertPos } from '../../lib/utils'
import ReactSubView from '../../views/ReactSubView'

const InsertAccessibilityElementIfMissing = (
  view: EditorView,
  getPos: () => number
) => {
  const $pos = view.state.tr.doc.resolve(getPos() + 1)
  const node = $pos.node()
  const accessibilityElement = findChildren(
    node,
    (child) =>
      child.type === schema.nodes.alt_text ||
      child.type === schema.nodes.long_desc,
    false
  )[0]

  if (!accessibilityElement) {
    const insertPos = getInsertPos(schema.nodes.alt_text, node, $pos.pos)

    view.dispatch(
      view.state.tr
        .insert(insertPos, schema.nodes.alt_text.create())
        .insert(insertPos + 2, schema.nodes.long_desc.create())
    )
  }
}

export const createAccessibilityElementsButton = (
  props: EditorProps,
  view: EditorView,
  container: HTMLElement,
  getPos: () => number
) =>
  ReactSubView(
    { ...props, dispatch: view.dispatch },
    AccessibilityElementsExpanderButton,
    {
      onExpand: () => {
        InsertAccessibilityElementIfMissing(view, getPos)
        container.classList.toggle('show_accessibility_element')
      },
    },
    view.state.selection.$from.node(),
    getPos,
    view,
    ['accessibility_element_expander_button']
  )

const AccessibilityElementsExpanderButton: React.FC<{
  onExpand: (expanded: boolean) => void
}> = ({ onExpand }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <ExpanderButton
      aria-label={'Toggle expand section'}
      onClick={() => {
        onExpand(!expanded)
        setExpanded(!expanded)
      }}
      style={{
        transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
      }}
    >
      <ArrowDownCircleIcon />
    </ExpanderButton>
  )
}
