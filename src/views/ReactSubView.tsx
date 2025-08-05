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

import { EditorProps } from '../configs/ManuscriptsEditor'
import { Trackable } from '../types'
import { flushSync } from 'react-dom'

export interface ReactViewComponentProps<NodeT extends ManuscriptNode> {
  nodeAttrs: NodeT['attrs']
  setNodeAttrs: (nextAttrs: Partial<NodeT['attrs']>) => void
  viewProps: {
    view: ManuscriptEditorView
    getPos: () => number
    node: ManuscriptNode | Trackable<ManuscriptNode>
  }
  container: HTMLDivElement
}
/*
  This is to render components that affect the Prosemirror Document indirectly. Such as dropdown buttons, inputs, advanced UX elements etc.
  MAKE SURE dispatch IS PASSED TO YOUR VIEW
*/
function createSubView<T extends Trackable<ManuscriptNode>>(
  props: EditorProps,
  Component: React.FC<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  componentProps: object,
  node: T,
  getPos: () => number,
  view: ManuscriptEditorView,
  classNames: string[] = []
): HTMLDivElement {
  const container = document.createElement('div')
  const Wrapped = createView<T>(
    props,
    Component,
    componentProps,
    node,
    getPos,
    view,
    classNames,
    container
  )
  const root = createRoot(container)
  root.render(<Wrapped />)
  return container
}

function createView<T extends Trackable<ManuscriptNode>>(
  props: EditorProps,
  Component: React.FC<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  componentProps: object,
  node: T,
  getPos: () => number,
  view: ManuscriptEditorView,
  classNames: string[] = [],
  container: HTMLDivElement
) {
  container.classList.add('tools-panel')
  if (classNames.length) {
    container.classList.add(...classNames)
    container.setAttribute('data-cy', classNames[0])
  }
  container.setAttribute('contenteditable', 'false')

  const Wrapped: React.FC = () => {
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
          container={container}
          {...props}
          {...componentProps}
        />
      </ThemeProvider>
    )
  }
  return Wrapped
}

/**
 * Due to async rendering in React, inline or persistent elements may flicker during rerendering.
 * To prevent that this wrapper allows to replace element with its new version only when it's already rendered.
 */
export function createSubViewAsync<T extends Trackable<ManuscriptNode>>(
  props: EditorProps,
  Component: React.FC<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  componentProps: object,
  node: T,
  getPos: () => number,
  view: ManuscriptEditorView,
  classNames: string[] = []
) {
  const container = document.createElement('div')
  const Wrapped = createView<T>(
    props,
    Component,
    componentProps,
    node,
    getPos,
    view,
    classNames,
    container
  )

  const root = createRoot(container)
  const res = new Promise<HTMLDivElement>((resolve) => {
    queueMicrotask(() => {
      flushSync(() => {
        root.render(<Wrapped />)
      })
      resolve(container)
    })
  })
  return res
}

export default createSubView
