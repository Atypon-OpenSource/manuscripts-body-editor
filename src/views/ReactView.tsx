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
  ManuscriptNode,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import { NodeView } from 'prosemirror-view'
import React, { useCallback, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import { Dispatch } from '../commands'

export interface ReactViewComponentProps<NodeT extends ManuscriptNode> {
  nodeAttrs: NodeT['attrs']
  setNodeAttrs: (nextAttrs: Partial<NodeT['attrs']>) => void
}

export default (dispatch: Dispatch) => <NodeT extends ManuscriptNode>(
  Component: React.FC<ReactViewComponentProps<NodeT>>,
  contentDOMElementType?: keyof HTMLElementTagNameMap | null
) => (
  node: NodeT,
  view: ManuscriptEditorView,
  getPos: () => number
): NodeView<ManuscriptSchema> => {
  const root = document.createElement('div')
  const reactChild = root.appendChild(document.createElement('div'))

  let contentDOM: HTMLElement | null
  if (contentDOMElementType) {
    contentDOM = document.createElement(contentDOMElementType)
    root.appendChild(contentDOM)
  } else {
    contentDOM = null
  }

  // a very simple event emitter that tracks the current value of ManuscriptNode
  // and injects it into Component
  let subscriber: ((node: NodeT['attrs']) => void) | null
  const setNode = (next: NodeT['attrs']) => {
    subscriber && subscriber(next)
  }
  const subscribe = (func: (node: NodeT['attrs']) => void) => {
    subscriber = func
  }
  const unsubscribe = () => {
    subscriber = null
  }

  const Wrapped: React.FC = () => {
    const [attrsState, setAttrsState] = useState<NodeT['attrs']>(node.attrs)
    useEffect(() => {
      subscribe(setAttrsState)
      return () => {
        unsubscribe()
      }
    }, [])

    const setNodeAttrs = useCallback(
      (nextAttrs: Partial<NodeT['attrs']>) => {
        const { selection, tr } = view.state

        tr.setNodeMarkup(getPos(), undefined, {
          ...attrsState,
          ...nextAttrs,
        }).setSelection(selection.map(tr.doc, tr.mapping))

        dispatch(tr)
      },
      [attrsState]
    )

    if (!attrsState) {
      return null
    }

    return <Component nodeAttrs={attrsState} setNodeAttrs={setNodeAttrs} />
  }

  ReactDOM.render(<Wrapped />, reactChild)

  return {
    dom: root,
    contentDOM,
    destroy: () => ReactDOM.unmountComponentAtNode(reactChild),
    update: (next: ManuscriptNode) => {
      setNode(next.attrs)
      return true
    },
  }
}
