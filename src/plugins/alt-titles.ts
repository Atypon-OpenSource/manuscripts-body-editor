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
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  AltTitleNode,
  AltTitlesSectionNode,
  ManuscriptEditorView,
  schema,
  TitleNode,
} from '@manuscripts/transform'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import { arrowDown } from '../icons'

export interface PluginState {
  collapsed: boolean
  title: [TitleNode, number] | undefined
  runningTitle: [AltTitleNode, number] | undefined
  shortTitle: [AltTitleNode, number] | undefined
  altTitlesSection: [AltTitlesSectionNode, number] | undefined
}

function getTitlesData(doc: ProseMirrorNode) {
  let title: [TitleNode, number] | undefined
  let runningTitle: [AltTitleNode, number] | undefined
  let shortTitle: [AltTitleNode, number] | undefined
  let altTitlesSection: [AltTitlesSectionNode, number] | undefined

  doc.descendants((node, pos) => {
    if (title && runningTitle && shortTitle && altTitlesSection) {
      return false
    }
    if (node.type === schema.nodes.title && node.textContent.length > 0) {
      // if title is empty we don't allow to edit alt titles
      title = [node as TitleNode, pos]
    }
    if (node.type === schema.nodes.alt_titles_section) {
      altTitlesSection = [node as AltTitlesSectionNode, pos]
    }
    if (node.type === schema.nodes.alt_title) {
      if (node.attrs.type === 'running') {
        runningTitle = [node as AltTitleNode, pos]
      }
      if (node.attrs.type === 'short') {
        shortTitle = [node as AltTitleNode, pos]
      }
    }
  })
  return { title, runningTitle, shortTitle, altTitlesSection }
}

function createAltTitlesButton(listener: () => void) {
  const altTitlesButton = document.createElement('button')
  altTitlesButton.classList.add('alt-titles-open', 'button-reset')
  altTitlesButton.innerHTML = arrowDown
  altTitlesButton.addEventListener('click', (e) => {
    e.preventDefault()
    listener()
  })
  return altTitlesButton
}

function selectionInAltTitles(from: number, to: number, state: PluginState) {
  if (state.runningTitle && state.shortTitle) {
    const range = {
      from: Math.min(state.runningTitle[1], state.shortTitle[1]),
      to: Math.max(
        state.runningTitle[1] + state.runningTitle[0].nodeSize,
        state.shortTitle[1] + state.shortTitle[0].nodeSize
      ),
    }
    // if selection overlaps with the range of alt titles, the selection is in the titles
    return Math.max(from, range.from) <= Math.min(to, range.to)
  }
  return false
}

export const altTitlesKey = new PluginKey<PluginState>('altTitles')

export default () => {
  return new Plugin<PluginState>({
    key: altTitlesKey,
    state: {
      init: (_, state) => {
        return { collapsed: true, ...getTitlesData(state.doc) }
      },
      apply: (tr, value) => {
        let newState = value
        if (tr.docChanged) {
          newState = { ...newState, ...getTitlesData(tr.doc) }
        }
        if (
          tr.selectionSet &&
          selectionInAltTitles(tr.selection.from, tr.selection.to, newState)
        ) {
          // if selection was set in the titles - open them
          newState = { ...newState, collapsed: false }
        }
        if (tr.getMeta(altTitlesKey)) {
          newState = {
            ...newState,
            ...tr.getMeta(altTitlesKey),
            ...getTitlesData(tr.doc),
          }
        }
        return newState
      },
    },
    appendTransaction: (transactions, _, newState) => {
      // in appendTransaction we check if alt_titles nodes exist before opening them for the first time because they are optional
      const tr = newState.tr
      if (
        !transactions.some((tr) => tr.getMeta(altTitlesKey)) ||
        !altTitlesKey.getState(newState)
      ) {
        return null
      }

      const { title, runningTitle, shortTitle, altTitlesSection } =
        altTitlesKey.getState(newState)!
      const schema = newState.schema

      if (!title) {
        return null
      }
      const titleEnd = title[0].nodeSize + title[1]
      if (!altTitlesSection) {
        const section = schema.nodes.alt_titles.create({}, [
          schema.nodes.alt_title.create({
            type: 'running',
          }),
          schema.nodes.alt_title.create({ type: 'short' }),
        ])
        tr.insert(titleEnd, section)
      } else {
        if (!runningTitle) {
          const title = schema.nodes.alt_title.create({
            type: 'running',
          })
          tr.insert(titleEnd, title)
        }
        if (!shortTitle) {
          const title = schema.nodes.alt_title.create({ type: 'short' })
          const newPos = tr.mapping.map(titleEnd)
          tr.insert(newPos, title)
        }
      }

      return tr
    },
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []
        const pState = altTitlesKey.getState(state)
        if (!pState || !pState.title) {
          return DecorationSet.empty
        }

        if (!pState.collapsed) {
          state.doc.descendants((node, pos) => {
            if (node.type === state.schema.nodes.alt_titles_section) {
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'alt-titles-section-open',
                })
              )
            }
          })
        } else if (pState.title[0].textContent.length) {
          // showing opening button only when titles are collapsed
          const titleEnd = pState.title[0].nodeSize + pState.title[1]
          decorations.push(
            Decoration.widget(
              titleEnd - 1,
              (view: ManuscriptEditorView) => {
                return createAltTitlesButton(() => {
                  const tr = view.state.tr.setMeta(altTitlesKey, {
                    collapsed: false,
                  })
                  view.dispatch(skipTracking(tr))
                })
              },
              {
                side: -1,
                key: 'title-' + titleEnd,
              }
            )
          )
        }
        return DecorationSet.create(state.doc, decorations)
      },
    },
  })
}
