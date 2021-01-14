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

import projectDump from '@manuscripts/examples/data/project-dump.json'
import {
  Build,
  Decoder,
  ManuscriptSchema,
} from '@manuscripts/manuscript-transform'
import {
  Manuscript,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { uniqueId } from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'

import {
  ApplicationMenus,
  getMenus,
  useApplicationMenus,
  useEditor,
} from '../src'
import { PopperManager } from '../src/lib/popper'
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
  const menus = useApplicationMenus(getMenus(editor))

  return (
    <div>
      <ApplicationMenus {...menus} />
      <hr />
      <div ref={onRender} id="editor"></div>
    </div>
  )
}

const start = async () => {
  const models = projectDump.data as Model[]

  const manuscript = models.find(
    (model) => model.objectType === ObjectTypes.Manuscript
  ) as Manuscript

  const modelMap = buildModelMap(models)
  const decoder = new Decoder(modelMap)
  const doc = decoder.createArticleNode()

  const getModel = <T extends Model>(id: string) =>
    modelMap.get(id) as T | undefined
  const deleteModel = (id: string) => {
    modelMap.delete(id)
    return Promise.resolve(id)
  }
  const saveModel = <T extends Model>(model: T | Build<T> | Partial<T>) => {
    const oldModel = getModel<T>(model._id)
    const updatedModel = {
      createdAt: Date.now() / 1000,
      updatedAt: Date.now() / 1000,
      _id: uniqueId(),
      ...oldModel,
      ...model,
    }
    modelMap.set(model._id, updatedModel)
    return Promise.resolve(updatedModel)
  }

  const props: Props = {
    doc,
    popper: new PopperManager(),
    locale: 'en-GB',
    permissions: { write: true },
    renderReactComponent: ReactDOM.render,
    unmountReactComponent: ReactDOM.unmountComponentAtNode,
    modelMap,
    getModel,
    saveModel,
    deleteModel,
    getManuscript: () => manuscript,
    projectID: 'my-project',
    retrySync: () => Promise.resolve(),
    setCommentTarget: () => undefined,
    getAttachment: () => new File([], 'my-file.png'),
    putAttachment: (file: File) => {
      console.log('uploading ', file)
      return Promise.resolve('uuid')
    },
  }

  ReactDOM.render(
    <EditorComponent {...props} />,
    document.getElementById('root')
  )
}
start()
