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

import { ManuscriptEditorView, ManuscriptNode } from '@manuscripts/transform'
import React, { useEffect, useState } from 'react'

import { Capabilities } from '../../lib/capabilities'
import { useDebounce } from '../hooks/use-debounce'
import { buildTree, DraggableTree, TreeItem } from './DraggableTree'

export interface ManuscriptOutlineProps {
  doc: ManuscriptNode | null
  can?: Capabilities
  view?: ManuscriptEditorView
}

export const ManuscriptOutline: React.FC<ManuscriptOutlineProps> = (props) => {
  const [values, setValues] = useState<{
    tree: TreeItem
    view?: ManuscriptEditorView
    can?: Capabilities
  }>()

  const debouncedProps = useDebounce(props, 500)

  useEffect(() => {
    const { doc, view } = debouncedProps

    if (doc) {
      const tree = buildTree({
        node: doc,
        pos: 0,
        index: 0,
      })

      setValues({ tree, view, can: props.can })
    } else {
      setValues(undefined)
    }
  }, [debouncedProps, props.can])
  return values && values.view ? <DraggableTree {...values} depth={0} /> : null
}
