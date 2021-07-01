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

import { Node as PMNode } from 'prosemirror-model'

export interface ChangeTreeNode {
  id: string
  node: PMNode
  depth: number
  type: string
  changes: Change[]
  path: number[]
  parent: string | null
  children: ChangeTreeNode[]
}

export interface Change {
  msg: string
  type: string
  key: string
  value: any
}
