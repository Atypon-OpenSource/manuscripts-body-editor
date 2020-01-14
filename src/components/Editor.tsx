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

import { ManuscriptSchema, schema } from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Model,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { RxAttachment, RxAttachmentCreator } from '@manuscripts/rxdb'
import CiteProc from 'citeproc'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import { transformPasted } from '../lib/paste'
import '../lib/smooth-scroll'
import plugins from '../plugins/editor'
import views from '../views/editor'
import { EditorBase, EditorBaseProps } from './EditorBase'

export interface EditorProps extends EditorBaseProps {
  allAttachments: (id: string) => Promise<Array<RxAttachment<Model>>>
  putAttachment: (
    id: string,
    attachment: RxAttachmentCreator
  ) => Promise<RxAttachment<Model>>
  getCurrentUser: () => UserProfile
  getCitationProcessor: () => CiteProc.Engine | undefined
  setLibraryItem: (item: BibliographyItem) => void
  matchLibraryItemByIdentifier: (
    item: BibliographyItem
  ) => BibliographyItem | undefined
  filterLibraryItems: (query: string) => Promise<BibliographyItem[]>
  retrySync: (componentIDs: string[]) => Promise<void>
  setCommentTarget: (commentTarget?: string) => void
  jupyterConfig: {
    url: string
    token: string
  }
}

export class Editor extends EditorBase<EditorProps> {
  constructor(props: EditorProps) {
    super(props)

    const {
      attributes,
      doc,
      environment,
      handleStateChange,
      permissions,
    } = this.props

    this.view = new EditorView(undefined, {
      editable: () => permissions.write,
      state: EditorState.create<ManuscriptSchema>({
        doc,
        schema,
        plugins: plugins(this.props),
      }),
      scrollThreshold: 100,
      // @ts-ignore (types)
      scrollMargin: {
        top: 100,
        bottom: 100,
        left: 0,
        right: 0,
      },
      dispatchTransaction: this.dispatchTransaction,
      nodeViews: views(this.props),
      attributes,
      transformPasted,
      handleDOMEvents: {
        focus: () => {
          handleStateChange(this.view, false)

          if (!this.isMouseDown) {
            this.view.focus()
          }

          return false
        },
      },
    })

    if (environment === 'development') {
      import('prosemirror-dev-tools')
        .then(({ applyDevTools }) => {
          applyDevTools(this.view)
        })
        .catch(error => {
          // tslint:disable-next-line:no-console
          console.error(
            'There was an error loading prosemirror-dev-tools',
            error.message
          )
        })
    }
  }
}
