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
  isElementNodeType,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptNodeType,
  nodeTitle,
  nodeTitlePlaceholder,
  schema,
  Selected,
} from '@manuscripts/transform'
import { Fragment, Node as ProsemirrorNode } from 'prosemirror-model'
import * as React from 'react'
import {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
  DragSource,
  DropTarget,
} from 'react-dnd'
import { findDOMNode } from 'react-dom'

import { ContextMenu } from '../../lib/context-menu'
import { isDeleted, isRejectedInsert } from '../../lib/track-changes-utils'
import { nodeTypeIcon } from '../../node-type-icons'
import { isSpecialSection } from '../../views/section_title'
import {
  Outline,
  OutlineDropPreview,
  OutlineItem,
  OutlineItemArrow,
  OutlineItemIcon,
  OutlineItemLink,
  OutlineItemLinkText,
  OutlineItemNoArrow,
  OutlineItemPlaceholder,
  StyledTriangleCollapsed,
  StyledTriangleExpanded,
} from './Outline'

export type DropSide = 'before' | 'after' | null

const excludedTypes = [
  schema.nodes.table,
  schema.nodes.figure,
  schema.nodes.footnotes_element,
  schema.nodes.bibliography_element,
  schema.nodes.keyword,
  schema.nodes.affiliations,
  schema.nodes.contributors,
  schema.nodes.title,
]

const childrenExcludedTypes = [
  schema.nodes.pullquote_element,
  schema.nodes.blockquote_element,
]

interface DragSourceProps {
  tree: TreeItem
  position: DropSide
}

interface DragObject {
  tree: TreeItem
}

interface ConnectedDragSourceProps {
  connectDragSource: ConnectDragSource
  connectDragPreview: ConnectDragPreview
  isDragging: boolean
  canDrag: boolean
  item: DragSourceProps
}

interface ConnectedDropTargetProps {
  connectDropTarget: ConnectDropTarget
  // isOver: boolean
  isOverCurrent: boolean
  canDrop: boolean
  itemType: string | symbol | null
}

type ConnectedProps = ConnectedDragSourceProps & ConnectedDropTargetProps

export interface TreeItem {
  index: number
  isSelected: boolean
  items: TreeItem[]
  node: ManuscriptNode | ProsemirrorNode
  pos: number
  endPos: number
  parent?: ManuscriptNode
}

interface Props {
  depth?: number
  tree: TreeItem
  view?: ManuscriptEditorView
  editArticle: boolean
}

interface State {
  open: boolean
  dragPosition: DropSide
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
  selected: Selected | null
  parent?: ManuscriptNode
}

type TreeBuilder = (options: TreeBuilderOptions) => TreeItem

export const buildTree: TreeBuilder = ({
  node,
  pos,
  index,
  selected,
  parent,
}): TreeItem => {
  const items: TreeItem[] = []
  const startPos = pos + 1 // TODO: don't increment this?
  const endPos = pos + node.nodeSize
  const isSelected = selected ? node.attrs.id === selected.node.attrs.id : false

  if (!isChildrenExcluded(node.type)) {
    node.forEach((childNode, offset, childIndex) => {
      if (
        (!childNode.isAtom || isElementNodeType(childNode.type) || isSpecialSection(childNode)) &&
        childNode.attrs.id &&
        !isExcluded(childNode.type)
      ) {
        items.push(
          buildTree({
            node: childNode,
            pos: startPos + offset,
            index: childIndex,
            selected,
            parent: node,
          })
        )
      }
    })
  }

  return { node, index, items, pos, endPos, parent, isSelected }
}

class Tree extends React.Component<Props & ConnectedProps, State> {
  public constructor(props: Props & ConnectedProps) {
    super(props)

    this.state = {
      open: !props.depth,
      dragPosition: null,
    }
  }

  public render(): React.ReactNode {
    const {
      depth = 0,
      tree,
      canDrop,
      connectDragSource,
      connectDragPreview,
      connectDropTarget,
      isDragging,
      isOverCurrent,
      item,
      view,
    } = this.props

    const { open, dragPosition } = this.state

    const { node, items, isSelected } = tree

    const isDeletedItem = isDeleted(node)

    const isRejectedItem = isRejectedInsert(node)

    const mightDrop = item && isOverCurrent && canDrop

    if (isRejectedItem || node.attrs.id === 'META_SECTION') {
      return null
    }

    return connectDropTarget(
      <div>
        {node.type.name !== 'titles' && (
          <Outline style={this.outlineStyles(isDragging)}>
            <OutlineDropPreview
              depth={depth}
              style={this.topPreviewStyles(mightDrop, dragPosition)}
            />

            {!isSpecialSection(node) && (
              <>
                {connectDragSource(
                  <div>
                    <OutlineItem
                      isSelected={isSelected}
                      depth={depth}
                      onContextMenu={this.handleContextMenu}
                    >
                      {items.length ? (
                        <OutlineItemArrow onClick={this.toggle}>
                          {open ? (
                            <StyledTriangleExpanded />
                          ) : (
                            <StyledTriangleCollapsed />
                          )}
                        </OutlineItemArrow>
                      ) : (
                        <OutlineItemNoArrow />
                      )}

                      <OutlineItemLink to={`#${node.attrs.id || ''}`}>
                        {connectDragPreview(
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <OutlineItemIcon>
                              {nodeTypeIcon(node.type)}
                            </OutlineItemIcon>
                          </span>
                        )}

                        <OutlineItemLinkText
                          className={`outline-text-${node.type.name} ${
                            isDeletedItem && 'deleted'
                          }`}
                        >
                          {this.itemText(node)}
                        </OutlineItemLinkText>
                      </OutlineItemLink>
                    </OutlineItem>
                  </div>
                )}
              </>
            )}

            {items.length ? (
              <div
                style={{
                  display: open || isSpecialSection(node) ? '' : 'none',
                }}
              >
                {items.map((subtree) => (
                  <DraggableTree
                    {...this.props}
                    key={subtree.node.attrs.id}
                    tree={subtree}
                    view={view}
                    depth={isSpecialSection(node) ? depth : depth + 1}
                  />
                ))}
              </div>
            ) : null}

            <OutlineDropPreview
              depth={depth}
              style={this.bottomPreviewStyles(mightDrop, dragPosition)}
            />
          </Outline>
        )}
      </div>
    )
  }

  private outlineStyles = (isDragging: boolean): React.CSSProperties => ({
    opacity: isDragging ? 0.5 : 1,
  })

  private bottomPreviewStyles = (
    mightDrop: boolean,
    dragPosition: DropSide
  ): React.CSSProperties => ({
    bottom: '-1px',
    visibility: mightDrop && dragPosition === 'after' ? 'visible' : 'hidden',
  })

  private topPreviewStyles = (
    mightDrop: boolean,
    dragPosition: DropSide
  ): React.CSSProperties => ({
    top: '0px',
    visibility: mightDrop && dragPosition === 'before' ? 'visible' : 'hidden',
  })

  private toggle = () => {
    this.setState({
      open: !this.state.open,
    })
  }

  private itemText = (node: ManuscriptNode) => {
    const text = nodeTitle(node)

    if (text) {
      return text.trim()
    }

    const placeholder = nodeTitlePlaceholder(node.type)

    return <OutlineItemPlaceholder>{placeholder}</OutlineItemPlaceholder>
  }

  private handleContextMenu: React.EventHandler<React.MouseEvent> = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!this.props.editArticle) {
      return false
    }

    const menu = this.createMenu()
    if (!menu) {
      return false
    }

    menu.showEditMenu(event.currentTarget as HTMLAnchorElement)
  }

  private createMenu = () => {
    const { tree, view } = this.props

    if (!view) {
      return null
    }

    // TODO: getPos?
    return new ContextMenu(tree.node, view, () => tree.pos - 1)
  }
}

const dragSource = DragSource<Props, ConnectedDragSourceProps, DragObject>(
  'outline',
  {
    // return data about the item that's being dragged, for later use
    beginDrag(props) {
      return {
        tree: props.tree,
      }
    },

    canDrag(props) {
      return props.editArticle && !!props.tree.parent
    },
  },
  (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
    canDrag: monitor.canDrag(),
    item: monitor.getItem(),
  })
)

const dropTarget = DropTarget<Props, ConnectedDropTargetProps>(
  'outline',
  {
    canDrop(props, monitor) {
      const item = monitor.getItem() as DragSourceProps

      if (!props.tree.parent) {
        return false
      }

      // can't drop on itself
      if (item.tree.node.attrs.id === props.tree.node.attrs.id) {
        return false
      }

      // can't drop within itself
      if (
        item.tree.pos <= props.tree.pos &&
        item.tree.endPos >= props.tree.endPos
      ) {
        return false
      }

      const index =
        item.position === 'before' ? props.tree.index : props.tree.index + 1

      // if (index === props.tree.parent.childCount) {
      //   return props.tree.parent.canAppend(item.tree.node)
      // }
      //
      // return props.tree.parent.canReplaceWith(index, index, item.tree.node.type)

      return props.tree.parent.canReplace(
        index,
        index,
        Fragment.from(item.tree.node)
      )
    },

    hover(props, monitor, component) {
      // if (!monitor.canDrop()) {
      //   return null
      // }

      if (monitor.isOver({ shallow: true })) {
        // Determine mouse position
        const offset = monitor.getClientOffset()

        if (offset) {
          // get the dragged item
          const item = monitor.getItem() as DragSourceProps

          // get the target DOM node
          // eslint-disable-next-line react/no-find-dom-node
          const node = findDOMNode(component) as Element

          // get the rectangle on screen
          const { bottom, top } = node.getBoundingClientRect()

          // get the vertical middle
          const verticalMiddle = (bottom - top) / 2

          // get pixels from the top
          const verticalHover = offset.y - top

          // store the position on the dragged item
          item.position = verticalHover < verticalMiddle ? 'before' : 'after'

          // from https://github.com/react-dnd/react-dnd/issues/179#issuecomment-236226301
          component.setState({
            dragPosition: item.position,
          })
        }
      }
    },

    drop(props, monitor) {
      if (monitor.didDrop()) {
        return
      } // already dropped on something else
      if (!props.view) {
        return
      } // cant drop without a view to transact upon

      const item = monitor.getItem() as DragSourceProps

      const source = item.tree
      const target = props.tree
      const side = item.position

      const insertPos =
        side === 'before'
          ? target.pos - 1
          : target.pos + target.node.nodeSize - 1

      let sourcePos = source.pos - 1

      // @TODO fix duplicated ids by cloning a node with a cleared id attribute
      // duplicated ids occurr when track changes are enabled and deletion is reverted and kept alongside with the newly inserted content

      const newNode = source.node.type.schema.nodes[
        source.node.type.name
      ].create(
        {
          ...source.node.attrs,
          id: '',
        },
        source.node?.content
      )
      const tr = props.view.state.tr.insert(insertPos, newNode)

      sourcePos = tr.mapping.map(sourcePos)

      tr.delete(sourcePos, sourcePos + source.node.nodeSize)

      props.view.dispatch(tr)
    },
  },
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    // isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
  })
)

const DraggableTree = dragSource(dropTarget(Tree))

export default DraggableTree
