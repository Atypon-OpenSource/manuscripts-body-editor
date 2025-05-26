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

import 'prosemirror-view/style/prosemirror.css'

import { UserProfile } from '@manuscripts/json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import { ManuscriptNode, schema, SectionCategory } from '@manuscripts/transform'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Location, NavigateFunction } from 'react-router-dom'
import { DefaultTheme } from 'styled-components'

import { CollabProvider } from '../classes/collabProvider'
import { clipboardParser } from '../clipboard'
import { Dispatch } from '../commands'
import { SnapshotLabel } from '../components/tools/CompareDocumentsModal'
import { transformCopied } from '../lib/copy'
import { FileAttachment, FileManagement } from '../lib/files'
import { handleScrollToSelectedTarget } from '../lib/helpers'
import { handlePaste, transformPasted, transformPastedHTML } from '../lib/paste'
import { INIT_META } from '../lib/plugins'
import { PopperManager } from '../lib/popper'
import plugins from './editor-plugins'
import views from './editor-views'

export type CSLProps = {
  style?: string
  locale?: string
}

export interface EditorProps {
  attributes?: { [key: string]: string }
  locale: string
  theme: DefaultTheme
  getCurrentUser: () => UserProfile

  projectID: string
  doc: ManuscriptNode
  getFiles: () => FileAttachment[]
  fileManagement: FileManagement

  popper: PopperManager

  getCapabilities: () => Capabilities
  userID: string
  debug: boolean
  cslProps: CSLProps
  sectionCategories: Map<string, SectionCategory>
  collabProvider?: CollabProvider
  navigate: NavigateFunction
  location: Location
  enableCompare?: boolean
  submissionId?: string
  dispatch?: Dispatch
  onEditorClick: (
    pos: number,
    node: ManuscriptNode,
    nodePos: number,
    event: MouseEvent
  ) => void
  lockBody: boolean
  snapshots?: SnapshotLabel[]
  getSnapshot?: (id: string) => Promise<any>
}

export type ExternalProps = Omit<EditorProps, 'popper' | 'dispatch'>

export const createEditorState = (
  props: EditorProps,
  snapshot?: ManuscriptNode
) =>
  EditorState.create({
    doc: snapshot || props.doc,
    schema,
    plugins: plugins(props),
  })

export const createEditorView = (
  props: EditorProps,
  root: HTMLElement,
  state: EditorState,
  dispatch: Dispatch
) => {
  const view = new EditorView(root, {
    state,
    editable: () => props.getCapabilities().editArticle,
    scrollMargin: {
      top: 100,
      bottom: 100,
      left: 0,
      right: 0,
    },
    dispatchTransaction: dispatch,
    nodeViews: views(props, dispatch),
    attributes: props.attributes,
    transformPastedHTML,
    transformPasted,
    handlePaste,
    clipboardParser,
    handleScrollToSelection: handleScrollToSelectedTarget,
    transformCopied,
    handleClickOn: (view, pos, node, nodePos, event) => {
      props.onEditorClick(pos, node, nodePos, event)
      // This to prevent changing editor selection when clicking on table cell context menu button
      if (
        event?.target &&
        (event.target as HTMLElement).classList.contains(
          'table-context-menu-button'
        )
      ) {
        return true
      }
    },
  })

  // running an init transaction allowing plugins to caught up with the document for the first time
  const tr = view.state.tr.setMeta(INIT_META, true)

  const nextState = view.state.apply(tr)
  view.updateState(nextState)
  return view
}
