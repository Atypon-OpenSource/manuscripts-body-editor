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

import projectDump from '@manuscripts/examples/data/project-dump.json'
import { Decoder, schema } from '@manuscripts/manuscript-transform'
import {
  Manuscript,
  Model,
  ObjectTypes,
  Project,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export const user: UserProfile = {
  _id: 'MPUserProfile:1',
  objectType: ObjectTypes.UserProfile,
  userID: 'User_example@foo.com',
  createdAt: 0,
  updatedAt: 0,
  bibliographicName: {
    _id: 'MPBibliographicName:1',
    objectType: ObjectTypes.BibliographicName,
  },
}

export const project: Project = {
  _id: 'MPProject:1',
  objectType: ObjectTypes.Project,
  title: 'Foo',
  createdAt: 0,
  updatedAt: 0,
  owners: [],
  writers: [],
  viewers: [],
}

export const manuscript: Manuscript = {
  _id: 'MPManuscript:1',
  objectType: ObjectTypes.Manuscript,
  containerID: project._id,
  createdAt: 0,
  updatedAt: 0,
}

export const modelMap: Map<string, Model> = new Map()

for (const model of projectDump.data) {
  modelMap.set(model._id, model as Model)
}

export const getModel = <T extends Model>(id: string) =>
  modelMap.get(id) as T | undefined

const decoder = new Decoder(modelMap)

export const doc = decoder.createArticleNode()

export const view = new EditorView(undefined, {
  state: EditorState.create({
    doc,
    schema,
  }),
})
