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

import { Capabilities } from '@manuscripts/style-guide'
import { ContributorNode, ManuscriptNodeView } from '@manuscripts/transform'

import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
import { Contributor } from '@manuscripts/json-schema'

export interface Props extends BaseNodeProps {
  getCapabilities: () => Capabilities
  openAuthorEditing: () => void
  selectAuthorForEditing: (authorId: string) => void
}

export class ContributorView<
  PropsType extends Props
> extends BaseNodeView<PropsType> {
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  container: HTMLElement

  public updateContents = () => {
    console.log(this)

    this.container = document.createElement('button')
    this.container.classList.add('contributor')
    this.container.setAttribute('id', this.node.attrs.id)

    const can = this.props.getCapabilities()

    const disableEditButton = !can.editMetadata

    const { bibliographicName, isCorresponding, email, id } = this.node
      .attrs as ContributorNode['attrs']

    // this.dom = this.dom || document.createElement('span')

    this.container.addEventListener('click', (e) => {
      e.preventDefault()
      if (!disableEditButton) {
        this.props.openAuthorEditing()
        this.props.selectAuthorForEditing(id)
      }
    })

    const name = this.buildNameLiteral(bibliographicName)
    this.container.innerHTML =
      isCorresponding && email ? `${name} (${email})` : name

    this.dom.replaceChildren(this.container)
  }

  initials = (given: string): string =>
    given
      ? given
          .trim()
          .split(' ')
          .map((part) => part.substr(0, 1).toUpperCase() + '.')
          .join('')
      : ''

  buildNameLiteral = ({ given = '', family = '', suffix = '' }) => {
    if (!given && !family) {
      return 'Unknown Author'
    }
    return [this.initials(given), family, suffix]
      .filter((part) => part)
      .join(' ')
  }

  protected createDOM = () => {
    this.dom = document.createElement('span')
  }

  // public initialise = () => {
  //   this.dom = this.createDOM()
  //   this.dom.classList.add('footnote')
  //   this.dom.addEventListener('click', this.handleClick)
  //   this.updateContents()
  // }

  public ignoreMutation = () => true

  // public stopEvent = () => true
  // public ignoreMutation = () => true
}

export default createNodeView(ContributorView)
