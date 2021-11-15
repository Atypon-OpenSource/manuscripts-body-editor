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
import { EditorState, NodeSelection, TextSelection } from 'prosemirror-state'
import { useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { useEditorContext } from '../context'

export function useFocusNodeOnRouteChange(state: EditorState) {
  const { viewProvider } = useEditorContext()
  const history = useHistory()
  const focusNodeWithId = useCallback(
    (id: string) => {
      const currentView = viewProvider?.view
      if (!id || !currentView || !state) {
        return
      }

      state.doc.descendants((node, pos) => {
        if (node.attrs.id === id) {
          currentView.focus()

          const selection = node.isAtom
            ? NodeSelection.create(state.tr.doc, pos)
            : TextSelection.near(state.tr.doc.resolve(pos + 1))

          currentView.dispatch(state.tr.setSelection(selection))
          const dom = currentView.domAtPos(pos + 1)

          if (dom.node instanceof Element) {
            dom.node.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest',
            })
          }

          return false
        }
      })
    },
    [viewProvider?.view, state]
  )
  useEffect(() => {
    const unlisten = history.listen(() => {
      // This will be evaluated on every route change. So, if
      // the route has changed and the node id is defined, we want to
      // focus that node.
      const nodeId = history.location.hash.substring(1)
      if (nodeId) {
        focusNodeWithId(nodeId)
      }
    })
    // This function will be invoked on component unmount and will clean up
    // the event listener.
    return () => {
      unlisten()
    }
  }, [history, focusNodeWithId])
}
