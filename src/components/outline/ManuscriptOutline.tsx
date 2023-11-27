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

import { Manuscript } from '@manuscripts/json-schema'
import { Capabilities } from '@manuscripts/style-guide'
import {
  ManuscriptEditorView,
  ManuscriptNode,
  Selected,
} from '@manuscripts/transform'
import React, { useEffect, useState } from 'react'

import { useDebounce } from '../hooks/use-debounce'
import DraggableTree, { buildTree, TreeItem } from './DraggableTree'

interface Props {
  manuscript: Manuscript
  selected: Selected | null
  doc: ManuscriptNode | null
  capabilities?: Capabilities
  view?: ManuscriptEditorView
}

export const ManuscriptOutline: React.FunctionComponent<Props> = (props) => {
  const [values, setValues] = useState<{
    tree: TreeItem
    view?: ManuscriptEditorView
    editArticle: boolean
  }>()

  const debouncedProps = useDebounce(props, 500)

  useEffect(() => {
    const { doc, view, selected } = debouncedProps

    if (doc) {
      const tree = buildTree({
        node: doc,
        pos: 0,
        index: 0,
        selected,
      })

      setValues({ tree, view, editArticle: !!props.capabilities?.editArticle })
    } else {
      setValues(undefined)
    }
  }, [debouncedProps, props.capabilities?.editArticle])

  return values ? <DraggableTree {...values} /> : null
}
