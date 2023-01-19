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

// import { gapCursor } from 'prosemirror-gapcursor'
import 'prosemirror-gapcursor/style/gapcursor.css'
import 'prosemirror-tables/style/tables.css'

import { Build } from '@manuscripts/manuscript-transform'
import {
  CommentAnnotation,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import persist from '@manuscripts/plugin-persist'
import { dropCursor } from 'prosemirror-dropcursor'
import { history } from 'prosemirror-history'
import { tableEditing } from 'prosemirror-tables'

import keys from '../src/keys'
import elements from '../src/plugins/elements'
import highlights from '../src/plugins/highlight'
import keywords from '../src/plugins/keywords'
import models from '../src/plugins/models'
import objects from '../src/plugins/objects'
import paragraphs from '../src/plugins/paragraphs'
import placeholder from '../src/plugins/placeholder'
import sections from '../src/plugins/sections'
import styles from '../src/plugins/styles'
import toc from '../src/plugins/toc'
import rules from '../src/rules'

interface PluginProps {
  deleteModel: (id: string) => Promise<string>
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  modelMap: Map<string, Model>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  setComment: (comment?: CommentAnnotation) => void
}

export default (props: PluginProps) => {
  const {
    deleteModel,
    getModel,
    getManuscript,
    modelMap,
    saveModel,
    setComment,
  } = props

  return [
    rules,
    ...keys,
    dropCursor(),
    // gapCursor(),
    history(),
    models({ saveModel, deleteModel }), // NOTE: this should come first
    elements(),
    persist(),
    sections(),
    toc({ modelMap }),
    styles({ getModel, getManuscript, modelMap }),
    keywords({ getManuscript, getModel }),
    objects({ getManuscript, getModel }),
    paragraphs(),
    placeholder(),
    tableEditing(),
    highlights({ setComment }),
  ]
}
