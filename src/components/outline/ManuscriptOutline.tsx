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
import React, { useCallback, useEffect, useRef, useState } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Get all visible outline items (excluding those in collapsed subtrees)
  const getOutlineItems = useCallback(() => {
    if (!containerRef.current) return []
    const allItems = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-outline-item]')
    )

    // Filter out items that are inside a collapsed subtree
    return allItems.filter((item) => {
      let parent = item.parentElement
      while (parent && parent !== containerRef.current) {
        if (
          parent.classList.contains('subtree') &&
          parent.classList.contains('collapsed')
        ) {
          return false
        }
        parent = parent.parentElement
      }
      return true
    })
  }, [])

  // Set roving tabindex: only first item is tabbable
  useEffect(() => {
    const items = getOutlineItems()
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1
    })
  }, [getOutlineItems, values])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return
      }

      const target = event.target as HTMLElement
      // Only handle if an outline item is focused
      if (!target.hasAttribute('data-outline-item')) {
        return
      }

      const items = getOutlineItems()
      const currentIndex = items.indexOf(target)

      if (currentIndex === -1) return

      event.preventDefault()

      let nextIndex: number
      if (event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % items.length
      } else {
        nextIndex = (currentIndex - 1 + items.length) % items.length
      }

      const nextItem = items[nextIndex]
      nextItem?.focus()
    },
    [getOutlineItems]
  )

  return values && values.view ? (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      <DraggableTree {...values} depth={0} />
    </div>
  ) : null
}
