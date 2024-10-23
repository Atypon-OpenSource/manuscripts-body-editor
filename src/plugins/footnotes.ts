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

import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  FootnoteNode,
  FootnotesElementNode,
  generateAlphaFootnoteLabel,
  InlineFootnoteNode,
  isTableElementNode,
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
import { isInit } from '../lib/plugins'

/**
 * The state for a single footnotes_element.
 */
export type FootnotesElementState = {
  /**
   * A list of inline_footnote nodes that reference footnote nodes in
   * this element.
   */
  inlineFootnotes: [InlineFootnoteNode, number][]
  /**
   * A set of footnote node IDs that are not referenced from any
   * inline_footnote node.
   */
  unusedFootnoteIDs: Set<string>
  /**
   * A list of footnote nodes, in reference order. i.e. footnote nodes
   * that are referenced earlier appear earlier in the list.
   */
  footnotes: [FootnoteNode, number][]
  element: [FootnotesElementNode, number]
  /**
   * footnote node ID => label
   */
  labels: Map<string, string>
}

export type FootnotesPluginState = {
  /**
   * footnote_element ID => state
   */
  footnotesElements: Map<string, FootnotesElementState>
  /**
   * Tracks the footnote_element node ID corresponding to a few important
   * node IDs. The node IDs tracked are:
   * - inline_footnote node IDs
   * - footnote node IDs
   * - table_element node IDs
   */
  footnotesElementIDs: Map<string, string>
}

export const footnotesKey = new PluginKey<FootnotesPluginState>('footnotes')

/**
 * This plugin provides support of footnotes related behaviours
 */
const buildPluginState = (doc: ManuscriptNode) => {
  const states = new Map()
  const ids = new Map()
  const elements = findChildrenByType(doc, schema.nodes.footnotes_element)
  elements.map(({ node, pos }) => {
    const container = findFootnotesContainerNode(doc, pos)
    const newState = buildFootnotesElementState(
      [container.node, container.pos],
      [node as FootnotesElementNode, pos]
    )
    const elementID = node.attrs.id
    states.set(elementID, newState)
    newState.footnotes.forEach(([n]) => ids.set(n.attrs.id, elementID))
    newState.inlineFootnotes.forEach(([n]) => ids.set(n.attrs.id, elementID))
    ids.set(container.node.attrs.id, elementID)
  })
  return {
    footnotesElements: states,
    footnotesElementIDs: ids,
  }
}

/**
 * Build the state for a single footnotes_element node.
 */
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

  // process footnote nodes
  const footnotes = findChildrenByType(element[0], schema.nodes.footnote)
  const footnoteIDs = new Set()
  footnotes.forEach(({ node, pos }) => {
    fn.footnotes.push([node as FootnoteNode, element[1] + pos + 1])
    // this set will start with every footnote node ID. Used IDs
    // will be removed from it while processing inline_footnote nodes.
    fn.unusedFootnoteIDs.add(node.attrs.id)
    footnoteIDs.add(node.attrs.id)
  })

  // process inline_footnote nodes
  let index = 0
  const inlineFootnotes = findChildrenByType(
    container[0],
    schema.nodes.inline_footnote
  )
  inlineFootnotes.sort((a, b) => a.pos - b.pos)
  // this is used to track footnote node IDs based on the order of
  // the corresponding inline_footnote nodes. It will be used later to
  // properly generate labels for footnotes, and to order the footnotes
  // in the state object.
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
    const label = rids
      .map((rid) => {
        //this is to ensure footnotes are processed only once
        if (fn.labels.has(rid)) {
          return fn.labels.get(rid)
        } else {
          const label = isTableElementNode(container[0])
            ? String(++index)
            : generateAlphaFootnoteLabel(index++)
          fn.labels.set(rid, label)
          fn.unusedFootnoteIDs.delete(rid)
          orderedFootnoteIDs.push(rid)
          return label
        }
      })
      .join(', ')
    fn.labels.set(node.attrs.id, label)
  })
  // At this point, the set includes only footnote node IDs that have no
  // corresponding inline_footnote. These should be added to the end
  // of the footnote node list.
  fn.unusedFootnoteIDs.forEach((id) => orderedFootnoteIDs.push(id))
  // Now the footnote list is sorted based on the appearance of the
  // corresponding inline_footnote nodes.
  fn.footnotes.sort(
    ([a], [b]) =>
      orderedFootnoteIDs.indexOf(a.attrs.id) -
      orderedFootnoteIDs.indexOf(b.attrs.id)
  )

  return fn
}

const hasChanged = (
  $new: FootnotesElementState,
  $old?: FootnotesElementState
) => {
  const nids = $new.footnotes.map(([node]) => node.attrs.id)
  const oids = $old?.footnotes.map(([node]) => node.attrs.id)
  return !(
    isEqual(nids, oids) &&
    isEqual($new.unusedFootnoteIDs, $old?.unusedFootnoteIDs)
  )
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
        return buildPluginState(newState.doc)
      },
    },
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.find((tr) => tr.docChanged || isInit(tr))) {
        return
      }
      const $old = footnotesKey.getState(oldState)
      const $new = footnotesKey.getState(newState)
      if (!$new) {
        return
      }

      const tr = newState.tr

      $new.footnotesElements.forEach((newState, key) => {
        const element = newState.element[0]
        const pos = newState.element[1]
        const oldState = $old?.footnotesElements.get(key)
        const footnotes = newState.footnotes.map(([node]) => node)

        if (hasChanged(newState, oldState)) {
          const newElement = schema.nodes.footnotes_element.create(
            element.attrs,
            // footnotes here is already in the correct order.
            footnotes
          )
          tr.replaceWith(pos, pos + element.nodeSize, newElement)
        }
      })

      if (!tr.steps.length) {
        return
      }

      // this is to ensure that the selection remains valid if it
      // was within a footnotes_element node that was replaced.
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
          fn.footnotes.forEach(([node, pos]) => {
            const to = pos + node.nodeSize
            const label = fn.labels.get(node.attrs.id)
            decorations.push(Decoration.node(pos, to, {}, { label }))
          })
          fn.inlineFootnotes.forEach(([node, pos]) => {
            const to = pos + node.nodeSize
            const label = fn.labels.get(node.attrs.id)
            decorations.push(Decoration.node(pos, to, {}, { label }))
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
