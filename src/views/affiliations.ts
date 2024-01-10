/*!
 * © 2023 Atypon Systems LLC
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
import React from 'react'

import { createNodeView } from './creators'
import { EditableBlockProps } from './editable_block'
import BlockView from './block_view'
import { affiliationsKey } from '../plugins/affiliations'

export interface ContributorsProps extends EditableBlockProps {
  components: Record<string, React.ComponentType<unknown>>
  subscribeStore: unknown
}

export class Affiliations<
  PropsType extends ContributorsProps
> extends BlockView<PropsType> {
  public ignoreMutation = () => true
  public stopEvent = () => true
}

export default createNodeView(Affiliations)
