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
  CrossReferenceNode,
  ManuscriptNodeView,
  schema,
  SupplementNode,
  Target,
} from '@manuscripts/transform'

import { findNodeByID } from '../lib/doc'
import { handleEnterKey } from '../lib/navigation-utils'
import { getSupplementDisplayLabel } from '../lib/supplements'
import { objectsKey } from '../plugins/objects'
import { Trackable } from '../types'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'

/**
 * Linked-file xrefs point at image_element ids. Once the linked file (extLink)
 * is removed, the image node remains in buildTargets as a plain image, but is
 * no longer a valid cross-reference target.
 */
export const isValidCrossReferenceTarget = (
  target?: Target
): target is Target => {
  if (!target) {
    return false
  }
  if (target.type === schema.nodes.image_element.name && !target.href) {
    return false
  }
  return true
}

export class CrossReferenceView
  extends BaseNodeView<Trackable<CrossReferenceNode>>
  implements ManuscriptNodeView
{
  public handleClick = () => {
    const rids = this.node.attrs.rids
    if (!rids.length) {
      return
    }
    this.props.navigate({
      pathname: this.props.location.pathname,
      hash: '#' + rids[0],
    })
  }

  public updateContents() {
    super.updateContents()
    const targets = objectsKey.getState(this.view.state) as Map<string, Target>
    const attrs = this.node.attrs
    const target = attrs.rids.length ? targets.get(attrs.rids[0]) : undefined
    const validTarget = isValidCrossReferenceTarget(target) ? target : undefined

    let derivedLabel = validTarget?.label || ''
    if (
      validTarget?.type === schema.nodes.supplement.name &&
      validTarget.href
    ) {
      const found = findNodeByID(this.view.state.doc, validTarget.id)
      if (found) {
        derivedLabel = getSupplementDisplayLabel(
          found.node as SupplementNode,
          this.props.getFiles()
        )
      }
    } else if (
      validTarget?.type === schema.nodes.image_element.name &&
      validTarget.href
    ) {
      const file = this.props.getFiles().find((f) => f.id === validTarget.href)
      derivedLabel = file?.name ?? ''
    }

    this.dom.textContent = attrs.label || derivedLabel
    this.dom.addEventListener('click', this.handleClick)
  }

  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public ignoreMutation = () => true

  public createDOM = () => {
    this.dom = document.createElement('span')
    this.dom.className = 'cross-reference'
    this.dom.tabIndex = 0

    this.dom.addEventListener(
      'keydown',
      handleEnterKey(() => this.handleClick())
    )
  }
}

export default createNodeView(CrossReferenceView)
