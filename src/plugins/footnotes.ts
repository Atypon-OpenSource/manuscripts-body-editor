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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  FootnoteNode,
  FootnotesElementNode,
  generateAlphaFootnoteLabel,
  InlineFootnoteNode,
  ManuscriptNode,
  schema,
} from '@manuscripts/transform'
import { isEqual } from 'lodash'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
import { findChildrenByType } from 'prosemirror-utils'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { EditorProps } from '../configs/ManuscriptsEditor'
import { findNodeByID } from '../lib/doc'
import {
  findFootnotesContainerNode,
  findParentFootnote,
} from '../lib/footnotes'

export type FootnotesElementState = {
  inlineFootnotes: [InlineFootnoteNode, number][]
  unusedFootnoteIDs: Set<string>
  footnotes: [FootnoteNode, number][]
  element: [FootnotesElementNode, number]
  labels: Map<string, string>
}

export type VersionedFootnotesElementState = FootnotesElementState & {
  version: string
}

export type FootnotesPluginState = {
  footnotesElements: Map<string, VersionedFootnotesElementState>
  footnotesElementIDs: Map<string, string>
}

export const footnotesKey = new PluginKey<FootnotesPluginState>('footnotes')

let version = 1

/**
 * This plugin provides support of footnotes related behaviours:
 *  - It adds and updates superscripted numbering of the footnotes on editor state changes
 *  - deletes inline footnotes when a footnotes is deleted
 *  - provides an ability to scroll to a footnote upon clicking on the respective inline footnotes
 */
const buildPluginState = (doc: ManuscriptNode, $old?: FootnotesPluginState) => {
  const states = new Map()
  const ids = new Map()
  const elements = findChildrenByType(doc, schema.nodes.footnotes_element)
  elements.map(({ node, pos }) => {
    const container = findFootnotesContainerNode(doc, pos)
    const oldState = $old?.footnotesElements.get(node.attrs.id)
    const newState = buildFootnotesElementState(
      [container.node, container.pos],
      [node as FootnotesElementNode, pos]
    )
    const elementID = node.attrs.id
    states.set(elementID, {
      ...newState,
      version: getVersion(newState, oldState),
    })
    newState.footnotes.forEach(([n]) => ids.set(n.attrs.id, elementID))
    ids.set(container.node.attrs.id, elementID)
  })
  return {
    footnotesElements: states,
    footnotesElementIDs: ids,
  }
}

const buildFootnotesElementState = (
  container: [ManuscriptNode, number],
  element: [FootnotesElementNode, number]
): FootnotesElementState => {
  const fn: FootnotesElementState = {
    element,
    inlineFootnotes: [],
    unusedFootnoteIDs: new Set(),
    footnotes: [],
    labels: new Map(),
  }

  const footnotes = findChildrenByType(element[0], schema.nodes.footnote)
  const footnoteIDs = new Set()
  footnotes.forEach(({ node, pos }) => {
    fn.footnotes.push([node as FootnoteNode, element[1] + pos + 1])
    fn.unusedFootnoteIDs.add(node.attrs.id)
    footnoteIDs.add(node.attrs.id)
  })

  let index = 0
  const inlineFootnotes = findChildrenByType(
    container[0],
    schema.nodes.inline_footnote
  )
  inlineFootnotes.sort((a, b) => a.pos - b.pos)
  const orderedFootnoteIDs: string[] = []
  inlineFootnotes.forEach(({ node, pos }) => {
    const inlineFootnote = node as InlineFootnoteNode
    const rids = inlineFootnote.attrs.rids
    if (rids.some((rid) => !footnoteIDs.has(rid))) {
      return
    }
    if (container[1]) {
      pos += container[1] + 1
    }
    fn.inlineFootnotes.push([node as InlineFootnoteNode, pos])
    rids.forEach((rid) => {
      if (orderedFootnoteIDs.indexOf(rid) < 0) {
        const label = container[1]
          ? String(++index)
          : generateAlphaFootnoteLabel(index++)
        fn.labels.set(rid, label)
        fn.unusedFootnoteIDs.delete(rid)
        orderedFootnoteIDs.push(rid)
      }
    })
  })
  fn.unusedFootnoteIDs.forEach((id) => orderedFootnoteIDs.push(id))
  fn.footnotes.sort(
    ([a], [b]) =>
      orderedFootnoteIDs.indexOf(a.attrs.id) -
      orderedFootnoteIDs.indexOf(b.attrs.id)
  )

  return fn
}

const getVersion = (
  $new: FootnotesElementState,
  $old?: VersionedFootnotesElementState
) => {
  const nids = $new.footnotes.map(([node]) => node.attrs.id)
  const oids = $old?.footnotes.map(([node]) => node.attrs.id)
  if (
    isEqual(nids, oids) &&
    isEqual($new.unusedFootnoteIDs, $old?.unusedFootnoteIDs)
  ) {
    return $old?.version
  }
  return String(version++)
}

export default (props: EditorProps) => {
  return new Plugin<FootnotesPluginState>({
    key: footnotesKey,
    state: {
      init(config, instance): FootnotesPluginState {
        return buildPluginState(instance.doc)
      },
      apply(tr, value, oldState, newState): FootnotesPluginState {
        const $old = footnotesKey.getState(oldState)
        if (!tr.docChanged && $old) {
          return $old
        }
        return buildPluginState(newState.doc, $old)
      },
    },
    appendTransaction(transactions, oldState, newState) {
      const $old = footnotesKey.getState(oldState)
      const $new = footnotesKey.getState(newState) as FootnotesPluginState

      const tr = newState.tr

      $new.footnotesElements.forEach((newState, key) => {
        const element = newState.element[0]
        const pos = newState.element[1]
        const oldState = $old?.footnotesElements.get(key)
        const footnotes = newState.footnotes.map(([node]) => node)

        if (newState.version !== oldState?.version) {
          const newElement = schema.nodes.footnotes_element.create(
            element.attrs,
            footnotes
          )
          tr.replaceWith(pos, pos + element.nodeSize, newElement)
        }
      })

      if (!tr.steps.length) {
        return
      }

      const selection = newState.selection
      const selectedFootnote = findParentFootnote(selection)
      if (selectedFootnote) {
        const pos = findNodeByID(tr.doc, selectedFootnote.node.attrs.id)?.pos
        if (pos) {
          tr.setSelection(TextSelection.create(tr.doc, pos + 2))
        }
      }

      skipTracking(tr)
      return tr
    },
    props: {
      decorations: (state) => {
        const fns = footnotesKey.getState(state)
        if (!fns) {
          return DecorationSet.empty
        }
        const decorations: Decoration[] = []
        fns.footnotesElements.forEach((fn) => {
          const version = fn.version
          fn.footnotes.forEach(([node, pos]) => {
            const to = pos + node.nodeSize
            decorations.push(Decoration.node(pos, to, {}, { version }))
          })
          fn.inlineFootnotes.forEach(([node, pos]) => {
            const to = pos + node.nodeSize
            decorations.push(Decoration.node(pos, to, {}, { version }))
          })
        })
        if (props.getCapabilities().editArticle) {
          const footnote = findParentFootnote(state.selection)
          if (footnote) {
            const pos = footnote.pos
            const to = pos + footnote.node.nodeSize
            decorations.push(
              Decoration.node(pos, to, {
                class: 'footnote-selected',
              })
            )
          }
        }
        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
