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

import { ManuscriptSchema } from '@manuscripts/manuscript-transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import React from 'react'
import { PopperManager } from '..'
import { SymbolPicker } from '../components/symbol-picker/SymbolPicker'

export const symbolsKey = new PluginKey('symbols')

interface Props {
  popper: PopperManager
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void
}

export default (props: Props) => {
  return new Plugin<DecorationSet, ManuscriptSchema>({
    key: symbolsKey,
    state: {
      init: (config, state) => {
        return DecorationSet.create(state.doc, [])
      },
      apply: (tr, decorations) => {
        decorations = decorations.map(tr.mapping, tr.doc)

        const meta = tr.getMeta(symbolsKey)

        if (meta) {
          const { pos } = meta

          const decoration = Decoration.widget(pos, (view, getPos) => {
            const popperContainer = document.createElement('div')
            popperContainer.className = 'symbol-picker'

            const handleClose = () => {
              props.popper.destroy()
              props.unmountReactComponent(popperContainer)
              window.removeEventListener('click', handleClickOutside)
            }

            const handleClickOutside = (event: MouseEvent) => {
              if (
                event.target &&
                !popperContainer.contains(event.target as Node)
              ) {
                handleClose()
              }
            }

            window.addEventListener('click', handleClickOutside)

            const handleSelect = (character: string) => {
              view.dispatch(view.state.tr.insertText(character, getPos()))
              handleClose()
            }

            const inline = document.createElement('span')

            window.setTimeout(() => {
              props.renderReactComponent(
                <SymbolPicker handleSelect={handleSelect} />,
                popperContainer
              )

              props.popper.show(inline, popperContainer, 'top')
            }, 100)

            return inline
          })

          decorations = decorations.add(tr.doc, [decoration])
        }

        return decorations
      },
    },
    props: {
      decorations: state => {
        return symbolsKey.getState(state)
      },
    },
  })
}
