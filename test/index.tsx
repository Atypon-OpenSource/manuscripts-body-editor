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

import '@babel/polyfill'

import projectDump from '@manuscripts/examples/data/project-dump-2.json'
import { Decoder, ManuscriptSchema } from '@manuscripts/manuscript-transform'
import { Model } from '@manuscripts/manuscripts-json-schema'
import React from 'react'
import ReactDOM from 'react-dom'

import {
  ApplicationMenus,
  getMenus,
  useApplicationMenus,
  useEditor,
} from '../src'
import config, { Props } from './config'

const buildModelMap = (models: Model[]): Map<string, Model> => {
  return new Map(
    models.map((model) => {
      return [model._id, model]
    })
  )
}

const EditorComponent: React.FC<Props> = (props) => {
  const initState = config.createState(props)
  const editor = useEditor<ManuscriptSchema>(
    initState,
    config.createView(props)
  )
  const { onRender } = editor
  const menus = useApplicationMenus(getMenus(editor, () => null))

  return (
    <div>
      <ApplicationMenus {...menus} />
      <hr />
      <div ref={onRender} id="editor"></div>
    </div>
  )
}

const start = async () => {
  const models = (projectDump.data as unknown) as Model[]

  const modelMap = buildModelMap(models)
  const decoder = new Decoder(modelMap)
  const doc = decoder.createArticleNode()

  const getModel = <T extends Model>(id: string) =>
    modelMap.get(id) as T | undefined

  const props: Props = {
    doc,
    permissions: { write: true },
    // @ts-ignore
    renderReactComponent: ReactDOM.render,
    unmountReactComponent: ReactDOM.unmountComponentAtNode,
    getModel,
  }

  ReactDOM.render(
    <EditorComponent {...props} />,
    document.getElementById('root')
  )
}
start()
