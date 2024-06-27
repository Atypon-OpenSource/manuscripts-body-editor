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
import { schema } from '@manuscripts/transform'
import { ResolvedPos } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import {
  ContextMenu,
  ContextMenuButton,
} from '../components/views/TableCellContextMenu'
import ReactSubView from '../views/ReactSubView'
import { getEditorProps } from './editor-props'

export default () => {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          const contextMenuButton = event
            .composedPath()
            .slice(0, 3)
            .find((element) =>
              (element as HTMLElement).classList.contains(
                'table-context-menu-button'
              )
            )

          contextMenuButton && event.preventDefault()
        },
      },
      decorations: (state) => {
        const { $from } = state.selection
        const props = getEditorProps(state)
        props.popper.destroy()

        if (isInTable($from)) {
          return DecorationSet.create(state.doc, [
            Decoration.widget($from.pos, toDom),
          ])
        }

        return DecorationSet.empty
      },
    },
  })
}

const isInTable = ($pos: ResolvedPos) => {
  const depth = $pos.depth
  const node = $pos.node(depth - 1)
  if (node.type === schema.nodes.table_row) {
    const table = $pos.node(depth - 2)
    return !(table.firstChild === node || table.lastChild === node)
  }
}

const toDom = (view: EditorView, getPos: () => number | undefined) => {
  const props = getEditorProps(view.state)

  const contextMenu = ReactSubView(
    { ...props, dispatch: view.dispatch },
    ContextMenu,
    { view },
    view.state.selection.$from.node(),
    () => getPos() as number,
    view,
    'table-cell-context-menu'
  )

  const contextMenuButton = ReactSubView(
    { ...props, dispatch: view.dispatch },
    ContextMenuButton,
    {
      toggleOpen: () => {
        if (props.popper.isActive()) {
          props.popper.destroy()
        } else {
          props.popper.show(contextMenuButton, contextMenu, 'right', false)
        }
      },
    },
    view.state.selection.$from.node(),
    () => getPos() as number,
    view
  )

  return contextMenuButton
}
