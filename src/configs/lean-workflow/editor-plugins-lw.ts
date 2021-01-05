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

import { GetCitationProcessor } from '@manuscripts/library'
import { Build, ManuscriptSchema } from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import track, { Commit } from '@manuscripts/track-changes'
import { dropCursor } from 'prosemirror-dropcursor'
import { history } from 'prosemirror-history'
import { Plugin } from 'prosemirror-state'
import { tableEditing } from 'prosemirror-tables'

import keys from '../../keys'
import bibliography from '../../plugins/bibliography'
import elements from '../../plugins/elements'
import highlights from '../../plugins/highlight'
import keywords from '../../plugins/keywords'
import models from '../../plugins/models'
import objects from '../../plugins/objects'
import paragraphs from '../../plugins/paragraphs'
import persist from '../../plugins/persist'
import placeholder from '../../plugins/placeholder'
import sections from '../../plugins/sections'
import styles from '../../plugins/styles'
import toc from '../../plugins/toc'
import rules from '../../rules'

interface PluginProps {
  commit: Commit | null
  deleteModel: (id: string) => Promise<string>
  getCitationProcessor: GetCitationProcessor
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  modelMap: Map<string, Model>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  setCommentTarget: (commentTarget?: string) => void
  plugins?: Array<Plugin<ManuscriptSchema>>
}

export default (props: PluginProps) => {
  const {
    commit,
    deleteModel,
    getCitationProcessor,
    getLibraryItem,
    getModel,
    getManuscript,
    modelMap,
    saveModel,
    setCommentTarget,
  } = props

  const plugins = props.plugins || []

  return [
    rules,
    ...keys,
    dropCursor(),
    // gapCursor(),
    history(),
    models({ saveModel, deleteModel }), // NOTE: this should come first
    ...plugins, // TODO: should these run after persist?
    elements(),
    persist(),
    sections(),
    toc({ modelMap }),
    styles({ getModel, getManuscript, modelMap }),
    keywords({ getManuscript, getModel }),
    bibliography({
      getCitationProcessor,
      getLibraryItem,
      getModel,
      getManuscript,
    }),
    objects({ getManuscript, getModel }),
    paragraphs(),
    placeholder(),
    tableEditing(),
    track(commit || undefined),
    highlights({ setCommentTarget }),
  ]
}

// for tables
document.execCommand('enableObjectResizing', false, 'false')
document.execCommand('enableInlineTableEditing', false, 'false')
