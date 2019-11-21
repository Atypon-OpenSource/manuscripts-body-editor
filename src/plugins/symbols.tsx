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

import {
  ManuscriptEditorView,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { SymbolPicker } from '@manuscripts/symbol-picker'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import React from 'react'
import { PopperManager } from '..'

export const symbolsKey = new PluginKey('symbols')

const PLUGIN_NAME = 'symbol-picker'

interface Props {
  popper: PopperManager
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void
}

export default (props: Props) => {
  const createDecoration = (
    view: ManuscriptEditorView,
    getPos: () => number
  ) => {
    const popperContainer = document.createElement('div')
    popperContainer.className = 'symbol-picker'

    const handleClose = () => {
      window.removeEventListener('mousedown', handleClickOutside)

      view.dispatch(
        view.state.tr
          .setMeta(symbolsKey, {
            remove: getPos(),
          })
          .setMeta('addToHistory', false)
      )

      props.unmountReactComponent(popperContainer)
      props.popper.destroy()
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (event.target && !popperContainer.contains(event.target as Node)) {
        handleClose()
      }
    }

    const handleSelectCharacter = (character: string) => {
      handleClose()
      view.dispatch(view.state.tr.insertText(character, getPos()))
    }

    const inline = document.createElement('span')

    window.setTimeout(() => {
      props.renderReactComponent(
        <SymbolPicker handleSelectCharacter={handleSelectCharacter} />,
        popperContainer
      )

      props.popper.show(inline, popperContainer, 'bottom')

      window.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return inline
  }

  return new Plugin<DecorationSet, ManuscriptSchema>({
    key: symbolsKey,
    state: {
      init: (config, state) => DecorationSet.create(state.doc, []),
      apply: (tr, decorations) => {
        decorations = decorations.map(tr.mapping, tr.doc)

        const meta = tr.getMeta(symbolsKey)

        if (meta) {
          if (meta.add) {
            decorations = decorations.add(tr.doc, [
              Decoration.widget(meta.add, createDecoration, {
                plugin: PLUGIN_NAME,
              }),
            ])
          }

          if (meta.remove) {
            decorations = decorations.remove(
              decorations.find(
                undefined,
                undefined,
                decoration => decoration.plugin === PLUGIN_NAME
              )
            )
          }
        }

        return decorations
      },
    },
    props: {
      decorations: state => symbolsKey.getState(state),
    },
  })
}
