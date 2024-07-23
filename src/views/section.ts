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
  PAGE_BREAK_AFTER,
  PAGE_BREAK_BEFORE,
  PAGE_BREAK_BEFORE_AND_AFTER,
} from '@manuscripts/transform'

import { BaseNodeProps } from './base_node_view'
import BlockView from './block_view'
import { createNodeView } from './creators'

export class SectionView<
  PropsType extends BaseNodeProps
> extends BlockView<PropsType> {
  public elementType = 'section'
  public element: HTMLElement
  public initialise = () => {
    this.createDOM()
    this.createElement()
    this.updateContents()
  }
  public createElement = () => {
    this.contentDOM = document.createElement(this.elementType)
    this.dom.appendChild(this.contentDOM)
  }
  public onUpdateContent = () => {
    const { titleSuppressed, generatedLabel, pageBreakStyle, id, category } =
      this.node.attrs
    const classnames: string[] = []

    if (titleSuppressed) {
      classnames.push('title-suppressed')
    }

    if (typeof generatedLabel === 'undefined' || generatedLabel) {
      classnames.push('generated-label')
    }

    if (
      pageBreakStyle === PAGE_BREAK_BEFORE ||
      pageBreakStyle === PAGE_BREAK_BEFORE_AND_AFTER
    ) {
      classnames.push('page-break-before')
    }

    if (
      pageBreakStyle === PAGE_BREAK_AFTER ||
      pageBreakStyle === PAGE_BREAK_BEFORE_AND_AFTER
    ) {
      classnames.push('page-break-after')
    }
    if (this.contentDOM) {
      this.contentDOM.id = id
      this.contentDOM.classList.add(...classnames)
      category && this.contentDOM.setAttribute('data-category', category)
    }
  }
}

export default createNodeView(SectionView)
