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
  Selected,
} from '@manuscripts/manuscript-transform'
import { Manuscript } from '@manuscripts/manuscripts-json-schema'
import { parse } from '@manuscripts/title-editor'
import React from 'react'
import { debounceRender } from '../DebounceRender'
import DraggableTree, { buildTree, TreeItem } from './DraggableTree'

interface Props {
  manuscript: Manuscript
  selected: Selected | null
  view: ManuscriptEditorView | null
  doc: ManuscriptNode | null
}

const ManuscriptOutline: React.FunctionComponent<Props> = ({
  doc,
  manuscript,
  selected,
  view,
}) => {
  if (!doc || !view) return null

  const { items } = buildTree({ node: doc, pos: 0, index: 0, selected })

  const node = parse(manuscript.title || '')

  const tree: TreeItem = {
    node,
    requirementsNode: doc,
    pos: 0,
    endPos: 0,
    index: 0,
    isSelected: !selected,
    items,
  }

  return <DraggableTree tree={tree} view={view} />
}

export const DebouncedManuscriptOutlineContainer = debounceRender<Props>(
  ManuscriptOutline,
  500,
  {
    leading: true,
  }
)
