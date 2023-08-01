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

import { schema } from '@manuscripts/transform'
import { ProsemirrorTestChain, TestEditorView } from 'jest-prosemirror'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import createPlugins from '../plugins/editor'
import createNodeViews from '../views/editor'
import { defaultEditorProps } from './default-editor-data'
import { polyfillDom } from './polyfill-dom'

jest.mock('@manuscripts/transform', () => {
  const mockTransformOriginal = jest.requireActual('@manuscripts/transform')
  return {
    ...mockTransformOriginal,
    // Ids are generated by the persist plugin in an appendTransaction
    generateNodeID: () => {
      return 'MOCKED_NODE_ID'
    },
  }
})

export function parseDoc(json: { [key: string]: unknown }) {
  return schema.nodeFromJSON(json)
}

export function setupEditor() {
  polyfillDom()

  const props = { ...defaultEditorProps }
  const { doc } = props
  const place = document.body.appendChild(document.createElement('div'))
  const state = EditorState.create({
    doc,
    schema,
    plugins: createPlugins(props),
  })
  const view = new EditorView(place, {
    state,
    scrollMargin: {
      top: 100,
      bottom: 100,
      left: 0,
      right: 0,
    },
    nodeViews: createNodeViews(props) as any,
  })

  return ProsemirrorTestChain.of(view as TestEditorView)
}
