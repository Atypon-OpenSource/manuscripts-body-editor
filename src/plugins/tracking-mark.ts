/*!
 * © 2023 Atypon Systems LLC
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
  CHANGE_OPERATION,
  CHANGE_STATUS,
  NodeAttrChange,
  NodeChange,
  trackChangesPluginKey,
  TrackedAttrs,
} from '@manuscripts/track-changes-plugin'
import { schema } from '@manuscripts/transform'
import { EditorState, Plugin } from 'prosemirror-state'
import { Decoration, DecorationAttrs, DecorationSet } from 'prosemirror-view'

/**
 * This plugin adds tracking marks for PM node that has just attributes without content
 * Like: (bibliography_item, citation, equation, inline_equation, figure)
 */
export default () =>
  new Plugin<DecorationSet>({
    state: {
      init: (tr, state) => {
        return DecorationSet.create(state.doc, buildDecorations(state))
      },
      apply: (tr, decorationSet, oldState, newState) => {
        const meta = tr.getMeta('track-changes-set-change-statuses')

        if (meta) {
          return DecorationSet.create(newState.doc, buildDecorations(newState))
        }

        return decorationSet
      },
    },
    props: {
      decorations: (state) => {
        return DecorationSet.create(state.doc, buildDecorations(state))
      },
    },
  })

const buildDecorations = (state: EditorState) => {
  const changeSet = trackChangesPluginKey.getState(state)?.changeSet

  if (!changeSet) {
    return []
  }

  const metaNodeChanges = [
    ...(changeSet.nodeChanges as NodeChange[]),
    ...(changeSet.nodeAttrChanges as NodeAttrChange[]),
  ].filter(({ nodeType }) => nodeType === schema.nodes.bibliography_item.name)

  const decorations: Decoration[] = []

  metaNodeChanges.map((change) => {
    const markDecoration = getMarkDecoration(change.dataTracked)

    decorations.push(
      Decoration.node(change.from, change.to, markDecoration, { id: change.id })
    )

    if (
      change.type === 'node-attr-change' &&
      change.dataTracked.status === CHANGE_STATUS.pending &&
      change.dataTracked.operation === CHANGE_OPERATION.set_node_attributes
    ) {
      decorations.push(
        Decoration.widget(change.from + 1, addAttrsTrackingButton(change), {
          key: change.id,
        })
      )
    }
  })

  return decorations
}

const addAttrsTrackingButton = (change: NodeAttrChange) => {
  const el = document.createElement('button')
  el.className = 'attrs-popper-button'
  el.value = change.id
  el.innerHTML = editIcon

  return el
}

const editIcon = `
 <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L14 4L9 9L6 10L7 7L12 2Z"
      stroke="#353535"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13 10V11.5C13 12.328 12.328 13 11.5 13H4.5C3.672 13 3 12.328 3 11.5V4.5C3 3.672 3.672 3 4.5 3H6"
      stroke="#353535"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`

export const getMarkDecoration = (dataTracked: TrackedAttrs) => {
  const style: {
    background?: string
    textDecoration?: string
    display?: string
  } = {}
  let className = undefined

  const { status, operation } = dataTracked

  if (
    (operation === CHANGE_OPERATION.delete ||
      operation === CHANGE_OPERATION.insert ||
      operation === CHANGE_OPERATION.set_node_attributes) &&
    status === CHANGE_STATUS.pending
  ) {
    style.background = '#ddf3fa'
  }

  if (
    (operation === CHANGE_OPERATION.insert ||
      operation === CHANGE_OPERATION.set_node_attributes) &&
    status === CHANGE_STATUS.accepted
  ) {
    style.background = '#bffca7'
  }

  if (
    operation === CHANGE_OPERATION.delete &&
    status === CHANGE_STATUS.pending
  ) {
    style.textDecoration = 'line-through'
  }

  if (
    (operation === CHANGE_OPERATION.insert &&
      status === CHANGE_STATUS.rejected) ||
    (operation === CHANGE_OPERATION.delete && status === CHANGE_STATUS.accepted)
  ) {
    style.display = 'none'
  }

  const showAttrsPopper =
    status === CHANGE_STATUS.pending &&
    operation === CHANGE_OPERATION.set_node_attributes

  if (showAttrsPopper) {
    className = 'attrs-track-mark'
  }

  return {
    class: className,
    style: `background: ${style.background};
   text-decoration: ${style.textDecoration};
   display: ${style.display};
   position: relative;`,
  } as DecorationAttrs
}
