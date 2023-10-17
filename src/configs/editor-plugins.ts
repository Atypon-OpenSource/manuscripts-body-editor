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

import {
  BibliographyItem,
  CommentAnnotation,
  Manuscript,
  Model,
} from '@manuscripts/json-schema'
import { CitationProvider } from '@manuscripts/library'
import { Capabilities } from '@manuscripts/style-guide'
import { Build, ManuscriptSchema } from '@manuscripts/transform'
import { dropCursor } from 'prosemirror-dropcursor'
import { history } from 'prosemirror-history'
import { Plugin } from 'prosemirror-state'
import { tableEditing } from 'prosemirror-tables'

import keys from '../keys'
import auxiliary_object_order from '../plugins/auxiliary_object_order'
import bibliography from '../plugins/bibliography'
import comment_annotation from '../plugins/comment_annotation'
import elements from '../plugins/elements'
import highlights from '../plugins/highlight'
import keywords from '../plugins/keywords'
import objects from '../plugins/objects'
import paragraphs from '../plugins/paragraphs'
import persist from '../plugins/persist'
import placeholder from '../plugins/placeholder'
import sections from '../plugins/sections'
import table_editing_fix from '../plugins/tables-cursor-fix'
import toc from '../plugins/toc'
import track_changes_ui from '../plugins/track-changes-ui'
import rules from '../rules'
import { CSLProps } from './ManuscriptsEditor'

interface PluginProps {
  deleteModel: (id: string) => Promise<string>
  getCitationProvider: () => CitationProvider | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
  getModelMap: () => Map<string, Model>
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  setComment: (comment?: CommentAnnotation) => void
  setSelectedComment: (id?: string) => void
  setEditorSelectedSuggestion?: (id?: string) => void
  getCapabilities: () => Capabilities
  plugins?: Array<Plugin<ManuscriptSchema>>
  cslProps: CSLProps
  setCiteprocCitations: (citations: Map<string, string>) => void
}

export default (props: PluginProps) => {
  const {
    getCitationProvider,
    getLibraryItem,
    getModel,
    getManuscript,
    getModelMap,
    setComment,
    setSelectedComment,
    cslProps,
    setEditorSelectedSuggestion,
    getCapabilities,
    setCiteprocCitations,
  } = props

  const plugins = props.plugins || []

  return [
    rules,
    ...keys,
    dropCursor(),
    // gapCursor(),
    history(),
    ...plugins, // TODO: should these run after persist?
    table_editing_fix(),
    elements(),
    persist(),
    sections(),
    toc({ getModelMap }),
    keywords({ getModel, getCapabilities }),
    bibliography({
      getCitationProvider,
      getLibraryItem,
      cslProps,
      setCiteprocCitations,
    }),
    objects({ getManuscript, getModel }),
    auxiliary_object_order({ getModelMap }),
    comment_annotation({ setComment, setSelectedComment }),
    paragraphs(),
    placeholder(),
    tableEditing(),
    highlights({ setComment }),
    track_changes_ui({ setEditorSelectedSuggestion }),
  ]
}

// for tables
document.execCommand('enableObjectResizing', false, 'false')
document.execCommand('enableInlineTableEditing', false, 'false')
