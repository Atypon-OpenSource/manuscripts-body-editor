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

import { CommentAnnotation, Manuscript, Model } from '@manuscripts/json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { Build, ManuscriptSchema } from '@manuscripts/transform'
import { collab } from 'prosemirror-collab'
import { dropCursor } from 'prosemirror-dropcursor'
import { history } from 'prosemirror-history'
import { Plugin } from 'prosemirror-state'
import { tableEditing } from 'prosemirror-tables'

import { CollabProvider } from '../classes/collabProvider'
import keys from '../keys'
import { PopperManager } from '../lib/popper'
import bibliography from '../plugins/bibliography'
import comment_annotation from '../plugins/comment_annotation'
import elements from '../plugins/elements'
import footnotes from '../plugins/footnotes'
import highlights from '../plugins/highlight'
import keywords from '../plugins/keywords'
import objects from '../plugins/objects'
import affiliations from '../plugins/affiliations'
import paragraphs from '../plugins/paragraphs'
import persist from '../plugins/persist'
import placeholder from '../plugins/placeholder'
import sections from '../plugins/sections'
import table_editing_fix from '../plugins/tables-cursor-fix'
import toc from '../plugins/toc'
import track_changes_ui from '../plugins/track-changes-ui'
import tracking_mark from '../plugins/tracking-mark'
import rules from '../rules'
import { CSLProps } from './ManuscriptsEditor'

interface PluginProps {
  getModelMap: () => Map<string, Model>
  getManuscript: () => Manuscript
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
  setComment: (comment?: CommentAnnotation) => void
  setSelectedComment: (id?: string) => void
  setEditorSelectedSuggestion?: (id?: string) => void
  getCapabilities: () => Capabilities
  plugins?: Plugin<ManuscriptSchema>[]
  cslProps: CSLProps
  popper: PopperManager
  collabProvider?: CollabProvider
}

export default (props: PluginProps) => {
  const plugins = props.plugins || []
  const allPlugins = [
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
    toc(props),
    keywords(props),
    bibliography(props),
    objects(props),
    affiliations(),
    comment_annotation(props),
    paragraphs(),
    placeholder(),
    tableEditing(),
    highlights(props),
    track_changes_ui(props),
    tracking_mark(),
    footnotes(),
  ]

  if (props.collabProvider) {
    allPlugins.push(collab({ version: props.collabProvider.currentVersion }))
  }

  return allPlugins
}

// for tables
document.execCommand('enableObjectResizing', false, 'false')
document.execCommand('enableInlineTableEditing', false, 'false')
