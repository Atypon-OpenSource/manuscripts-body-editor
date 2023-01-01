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

import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import CodeMirror from 'codemirror'

import { CodemirrorMode } from '../lib/codemirror-modes'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

export class ListingView<PropsType extends BaseNodeProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  protected container: HTMLElement
  protected attachmentsNode: HTMLElement
  protected outputNode: HTMLElement
  protected editor: CodeMirror.Editor

  public ignoreMutation = () => true

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const { contents, isExpanded } = this.node.attrs

    if (this.editor) {
      if (isExpanded) {
        this.editor.refresh()
      }
      if (contents !== this.editor.getValue()) {
        this.editor.setValue(contents)
      }
    }
  }

  protected createDOM = () => {
    this.dom = document.createElement('div')
    this.dom.classList.add('listing')

    this.container = document.createElement('div')
    this.dom.appendChild(this.container)

    this.createEditor().catch((error) => {
      console.error(error) // tslint:disable-line:no-console
    })
  }

  // noinspection HtmlDeprecatedTag
  protected createEditor = async (defaultPlaceholder = '<Listing>') => {
    const { contents, languageKey, placeholder } = this.node.attrs

    const { createEditor } = await import('../lib/codemirror')

    const { codemirrorModeOptions } = await import('../lib/codemirror-modes')

    this.editor = await createEditor({
      readOnly: true,
      value: contents,
      mode:
        languageKey in codemirrorModeOptions
          ? codemirrorModeOptions[languageKey as CodemirrorMode]
          : languageKey,
      placeholder: placeholder || defaultPlaceholder,
      autofocus: false,
    })

    this.container.appendChild(this.editor.getWrapperElement())

    // TODO: show selected language

    this.refreshEditor()
  }

  protected refreshEditor = () => {
    window.requestAnimationFrame(() => {
      this.editor.refresh()
    })
  }

  protected focusEditor = () => {
    window.requestAnimationFrame(() => {
      this.editor.focus()
    })
  }

  protected toggleListing = (isExpanded: boolean) => {
    this.setNodeAttrs({ isExpanded })

    if (isExpanded) {
      this.refreshEditor()
      this.focusEditor()
    }
  }

  protected setNodeAttrs = (attrs: Record<string, unknown>) => {
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        ...attrs,
      })
    )
  }
}

export default createNodeView(ListingView)
