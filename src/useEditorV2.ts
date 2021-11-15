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

import { schema } from '@manuscripts/manuscript-transform'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useRef } from 'react'

import { EditorProviders } from './context'
import { useSSRLayoutEffect } from './hooks'
import { transformPasted } from './lib/paste'
import { default as createPlugins } from './plugins/editor'
import { UseEditorProps } from './typings/editor'
import { default as createNodeViews } from './views/editor'

const useEditor = (
  editorProps: UseEditorProps,
  editorDOMRef: React.RefObject<HTMLElement>
) => {
  const editorViewRef = useRef<EditorView | null>(null)

  useSSRLayoutEffect(() => {
    if (editorDOMRef.current) {
      editorViewRef.current = init(
        editorDOMRef.current,
        editorProps,
        editorViewRef.current
      )
    }
    return () => {
      editorViewRef.current?.destroy()
    }
  }, [editorDOMRef.current, editorProps])

  function init(
    element: HTMLElement,
    props: UseEditorProps,
    oldView?: EditorView | null
  ) {
    const { ctx } = props
    ctx.extensionProvider.init(ctx, props.extensions || [])
    const state = props.initialState || createEditorState(ctx, props)
    const view = oldView || createEditorView(element, state, ctx, props)
    if (oldView) {
      view.setProps({
        state,
        dispatchTransaction(tr: Transaction) {
          const oldEditorState = this.state
          const newState = oldEditorState.apply(tr)
          this.updateState(newState)
          ctx.viewProvider.updateState(newState)
          ctx.pluginStateProvider.updatePluginListeners(
            oldEditorState,
            newState
          )
          props.onEdit && props.onEdit(newState)
        },
      })
    }
    if (window) {
      // @ts-ignore
      window.editorView = view
    }
    ctx.viewProvider.init(view)
    ctx.viewProvider.updateState(state)
    props.onEditorReady && props.onEditorReady(ctx)
    return view
  }

  function createEditorState(ctx: EditorProviders, props: UseEditorProps) {
    return EditorState.create({
      schema,
      plugins: [
        ...createPlugins(props.manuscriptsProps),
        ...ctx.extensionProvider.plugins,
      ],
    })
  }

  function createEditorView(
    element: HTMLElement,
    state: EditorState,
    ctx: EditorProviders,
    props: UseEditorProps
  ) {
    return new EditorView(
      { mount: element },
      {
        state,
        scrollThreshold: 100,
        scrollMargin: {
          top: 100,
          bottom: 100,
          left: 0,
          right: 0,
        },
        nodeViews: createNodeViews(props.manuscriptsProps),
        transformPasted,
        dispatchTransaction(tr: Transaction) {
          const oldEditorState = this.state
          const newState = oldEditorState.apply(tr)
          this.updateState(newState)
          ctx.viewProvider.updateState(newState)
          ctx.pluginStateProvider.updatePluginListeners(
            oldEditorState,
            newState
          )
          props.onEdit && props.onEdit(newState)
        },
      }
    )
  }
}

export default useEditor
