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

import { ManuscriptEditorView, ManuscriptNode } from '@manuscripts/transform'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'

import { Dispatch } from '../commands'
import { EditableBlockProps } from './editable_block'

export interface ReactViewComponentProps<NodeT extends ManuscriptNode> {
  nodeAttrs: NodeT['attrs']
  setNodeAttrs: (nextAttrs: Partial<NodeT['attrs']>) => void
  contentDOM?: HTMLElement | null
  viewProps: {
    view: ManuscriptEditorView
    getPos: () => number
    node: ManuscriptNode
  }
  dispatch: Dispatch
}
/*
  This is to render components that affect the Prosemirror Document indirectly. Such as dropdown buttons, inputs, advanced UX elements etc.
  MAKE SURE dispatch IS PASSED TO YOUR VIEW
*/

export default (
  props: EditableBlockProps,
  Component: React.FC<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  componentProps: object,
  node: ManuscriptNode,
  getPos: () => number,
  view: ManuscriptEditorView,
  classNames = ''
  // contentDOMElementType?: keyof HTMLElementTagNameMap | null

  // parentContentDOM: HTMLElement
): HTMLDivElement => {
  const container = document.createElement('div')
  container.classList.add('tools-panel')
  if (classNames) {
    container.classList.add(classNames)
  }
  container.setAttribute('contenteditable', 'false')

  const Wrapped: React.FC = () => {
    // @TODO consider implementing subscription to avoid many rerenders - this is why those comments are kept
    // const [node, setNode] = useState<ManuscriptNode>(initialNode)
    // useEffect(() => {
    //   subscribe((node) => {
    //     setNode(node)
    //   })
    //   return () => {
    //     unsubscribe()
    //   }
    // }, [])

    const setNodeAttrs = (nextAttrs: Partial<ManuscriptNode['attrs']>) => {
      const { selection, tr } = view.state

      tr.setNodeMarkup(getPos(), undefined, {
        ...node.attrs,
        ...nextAttrs,
      }).setSelection(selection.map(tr.doc, tr.mapping))

      view.dispatch(tr)
    }

    return (
      <ThemeProvider theme={props.theme}>
        <Component
          nodeAttrs={node.attrs}
          setNodeAttrs={setNodeAttrs}
          viewProps={{ node, view, getPos }}
          {...props}
          {...componentProps}
        />
      </ThemeProvider>
    )
  }
  const root = createRoot(container)

  root.render(<Wrapped />)

  return container
}
