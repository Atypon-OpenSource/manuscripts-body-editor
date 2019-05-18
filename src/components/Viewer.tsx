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

import {
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptSchema,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Manuscript,
  Model,
  UserProfile,
} from '@manuscripts/manuscripts-json-schema'
import { History } from 'history'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import 'prosemirror-view/style/prosemirror.css'
import React from 'react'
import { RxAttachment } from 'rxdb'
import { PopperManager } from '../lib/popper'
import '../lib/smooth-scroll'
import plugins from '../plugins/viewer'
import views from '../views/viewer'

export interface ViewerProps {
  attributes?: { [key: string]: string }
  doc: ManuscriptNode
  getModel: <T extends Model>(id: string) => T | undefined
  allAttachments: (id: string) => Promise<Array<RxAttachment<Model>>>
  getManuscript: () => Manuscript
  getLibraryItem: (id: string) => BibliographyItem | undefined
  locale: string
  modelMap: Map<string, Model>
  popper: PopperManager
  manuscript: Manuscript
  projectID: string
  getCurrentUser: () => UserProfile
  history: History
  renderReactComponent: (child: React.ReactNode, container: HTMLElement) => void
  unmountReactComponent: (container: HTMLElement) => void
  components: {
    [key: string]: React.ComponentType<any> // tslint:disable-line:no-any
  }
}

export class Viewer extends React.PureComponent<ViewerProps> {
  private readonly editorRef = React.createRef<HTMLDivElement>()
  private readonly view: ManuscriptEditorView

  constructor(props: ViewerProps) {
    super(props)

    const { attributes, doc } = this.props

    this.view = new EditorView<ManuscriptSchema>(undefined, {
      editable: () => false,
      state: EditorState.create<ManuscriptSchema>({
        doc,
        schema,
        plugins: plugins(this.props),
      }),
      nodeViews: views(this.props),
      attributes,
    })
  }

  public componentDidMount() {
    if (this.editorRef.current) {
      this.editorRef.current.appendChild(this.view.dom)
    }
  }

  public render() {
    return <div ref={this.editorRef} />
  }
}
