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
  Capabilities,
  TriangleCollapsedIcon,
  TriangleExpandedIcon,
} from '@manuscripts/style-guide'
import {
  isElementNodeType,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeTitle,
  nodeTitlePlaceholder,
  schema,
} from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import React, { MouseEvent, useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import { ContextMenu } from '../../lib/context-menu'
import { DropSide, getDropSide } from '../../lib/dnd'
import { isDeleted } from '../../lib/track-changes-utils'
import { nodeTypeIcon } from '../../node-type-icons'
import {
  Outline,
  OutlineItem,
  OutlineItemArrow,
  OutlineItemIcon,
  OutlineItemLink,
  OutlineItemLinkText,
  OutlineItemNoArrow,
  OutlineItemPlaceholder,
} from './Outline'

const excludedTypes = [
  schema.nodes.table,
  schema.nodes.figure,
  schema.nodes.footnotes_element,
  schema.nodes.bibliography_element,
  schema.nodes.keywords,
  schema.nodes.affiliations,
  schema.nodes.contributors,
  schema.nodes.author_notes,
  schema.nodes.title,
  schema.nodes.embed,
  schema.nodes.image_element,
]

const childrenExcludedTypes = [
  schema.nodes.pullquote_element,
  schema.nodes.blockquote_element,
]

export interface TreeItem {
  index: number
  items: TreeItem[]
  node: ManuscriptNode
  pos: number
  endPos: number
  parent?: ManuscriptNode
}

const isExcluded = (nodeType: ManuscriptNodeType) => {
  return excludedTypes.includes(nodeType)
}

const isChildrenExcluded = (nodeType: ManuscriptNodeType) => {
  return childrenExcludedTypes.includes(nodeType)
}

interface TreeBuilderOptions {
  node: ManuscriptNode
  pos: number
  index: number
  parent?: ManuscriptNode
}

type TreeBuilder = (options: TreeBuilderOptions) => TreeItem

const isAbstractOrBackmatter = (item: TreeItem) => {
  return (
    item.parent &&
    (item.parent.type === schema.nodes.abstracts ||
      item.parent.type === schema.nodes.backmatter)
  )
}

const isManuscriptNode = (node: ManuscriptNode | undefined) => {
  return node?.type === schema.nodes.manuscript
}

export const buildTree: TreeBuilder = ({
  node,
  pos,
  index,
  parent,
}): TreeItem => {
  const items: TreeItem[] = []
  const startPos = pos + 1 // TODO: don't increment this?
  const endPos = pos + node.nodeSize

  if (!isChildrenExcluded(node.type)) {
    node.forEach((childNode, offset, childIndex) => {
      if (isExcluded(childNode.type)) {
        return
      }
      if (
        isManuscriptNode(node) ||
        ((!childNode.isAtom || isElementNodeType(childNode.type)) &&
          childNode.attrs.id)
      ) {
        items.push(
          buildTree({
            node: childNode,
            pos: startPos + offset,
            index: childIndex,
            parent: node,
          })
        )
      }
    })
  }

  return { node, index, items, pos, endPos, parent }
}

export interface DraggableTreeProps {
  depth: number
  tree: TreeItem
  view?: ManuscriptEditorView
  can?: Capabilities
}

export const DraggableTree: React.FC<DraggableTreeProps> = ({
  tree,
  view,
  depth,
  can,
}) => {
  const [dropSide, setDropSide] = useState<DropSide>()
  const [isOpen, setOpen] = useState(depth === 0)
  const ref = useRef<HTMLDivElement>(null)

  const { node, items, parent } = tree

  const itemText = (node: ManuscriptNode) => {
    const text = nodeTitle(node)

    if (text) {
      return text.trim()
    }

    const placeholder = nodeTitlePlaceholder(node.type)

    return <OutlineItemPlaceholder>{placeholder}</OutlineItemPlaceholder>
  }

  const toggleOpen = () => {
    setOpen(!isOpen)
  }

  const [{ isDragging }, dragRef] = useDrag({
    type: 'outline',
    item: tree,
    canDrag: () => {
      return depth !== 0
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, dropRef] = useDrop({
    accept: 'outline',
    canDrop(item: TreeItem, monitor) {
      if (isAbstractOrBackmatter(item) || isAbstractOrBackmatter(tree)) {
        return false
      }
      if (!ref.current) {
        return false
      }
      if (!tree.parent) {
        return false
      }
      // can't drop on itself
      if (item.node.attrs.id === tree.node.attrs.id) {
        return false
      }
      // can't drop within itself
      if (item.pos <= tree.pos && item.endPos >= tree.endPos) {
        return false
      }
      // can't drop immediately before/after itself
      if (tree.pos === item.endPos || item.pos === tree.endPos) {
        return false
      }

      const side = getDropSide(ref.current, monitor)
      const index = side === 'before' ? tree.index : tree.index + 1

      return tree.parent.canReplace(index, index, Fragment.from(item.node))
    },
    hover(item, monitor) {
      if (!ref.current || !monitor.canDrop()) {
        return
      }
      const side = getDropSide(ref.current, monitor)
      setDropSide(side)
    },
    drop(item: TreeItem, monitor) {
      if (!ref.current || !view) {
        return
      }
      const side = getDropSide(ref.current, monitor)
      const pos = side === 'before' ? tree.pos - 1 : tree.endPos - 1
      let sourcePos = item.pos - 1

      const node = item.node.type.schema.nodes[item.node.type.name].create(
        {
          ...item.node.attrs,
          id: '',
        },
        item.node.content
      )

      const tr = view.state.tr.insert(pos, node)
      sourcePos = tr.mapping.map(sourcePos)
      tr.delete(sourcePos, sourcePos + item.node.nodeSize)
      view.dispatch(tr)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  })

  const isDeletedItem = isDeleted(node)

  const isTop = isManuscriptNode(parent)

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!can?.editArticle) {
      return false
    }
    if (!view) {
      return null
    }

    const menu = new ContextMenu(tree.node, view, () => tree.pos - 1)
    menu.showEditMenu(e.currentTarget as HTMLAnchorElement)
  }

  dragRef(dropRef(ref))

  const dragClass = isDragging ? 'dragging' : ''
  const dropClass = isOver && dropSide ? `drop-${dropSide}` : ''

  return (
    <Outline
      ref={ref}
      className={`${dragClass} ${dropClass} ${isDeletedItem && 'deleted'}`}
    >
      {!isTop && node.type.name != 'manuscript' && (
        <OutlineItem depth={depth} onContextMenu={handleContextMenu}>
          {items.length ? (
            <OutlineItemArrow onClick={toggleOpen}>
              {isOpen ? <TriangleExpandedIcon /> : <TriangleCollapsedIcon />}
            </OutlineItemArrow>
          ) : (
            <OutlineItemNoArrow />
          )}

          <OutlineItemLink to={`#${node.attrs.id}`}>
            <OutlineItemIcon>{nodeTypeIcon(node.type)}</OutlineItemIcon>
            <OutlineItemLinkText className={`outline-text-${node.type.name}`}>
              {itemText(node)}
            </OutlineItemLinkText>
          </OutlineItemLink>
        </OutlineItem>
      )}

      {items.length ? (
        <div className={`subtree ${isOpen ? '' : 'collapsed'}`}>
          {items.map((subtree, index) => (
            <DraggableTree
              key={subtree.node.attrs.id || 'subtree-' + index}
              tree={subtree}
              view={view}
              depth={!tree.parent ? depth : depth + 1}
              can={can}
            />
          ))}
        </div>
      ) : null}
    </Outline>
  )
}
