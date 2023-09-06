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

// import CloseIconDark from '@manuscripts/assets/react/CloseIconDark'
import { Capabilities } from '@manuscripts/style-guide'
import { ManuscriptNodeView } from '@manuscripts/transform'

// import { createElement } from 'react'
// import ReactDOM from 'react-dom'
// import { sanitize } from '../lib/dompurify'
// import {
//   getChangeClasses,
//   isDeleted,
//   isPending,
//   isRejectedInsert,
// } from '../lib/track-changes-utils'
import { BaseNodeProps, BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'
export interface Props extends BaseNodeProps {
  getCapabilities: () => Capabilities
}
export class KeywordView<PropsType extends Props>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView
{
  public stopEvent = () => true
  public ignoreMutation = () => true
}

export default createNodeView(KeywordView)
