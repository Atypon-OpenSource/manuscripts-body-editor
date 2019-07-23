import { isElementNode, nodeTitle, nodeTitlePlaceholder, } from '@manuscripts/manuscript-transform';
import { Fragment } from 'prosemirror-model';
import * as React from 'react';
import { DragSource, DropTarget, } from 'react-dnd';
import { findDOMNode } from 'react-dom';
import { ContextMenu } from '../../lib/context-menu';
import { nodeTypeIcon } from '../../node-type-icons';
import { RequirementsAlert } from '../requirements/RequirementsAlert';
import { Outline, OutlineDropPreview, OutlineItem, OutlineItemArrow, OutlineItemIcon, OutlineItemLink, OutlineItemLinkText, OutlineItemNoArrow, OutlineItemPlaceholder, StyledTriangleCollapsed, StyledTriangleExpanded, } from './Outline';
const isExcluded = (nodeType) => {
    const { nodes } = nodeType.schema;
    const excludedTypes = [nodes.table];
    return excludedTypes.includes(nodeType);
};
export const buildTree = ({ node, pos, index, selected, parent, }) => {
    const items = [];
    const startPos = pos + 1;
    const endPos = pos + node.nodeSize;
    const isSelected = selected ? node.attrs.id === selected.node.attrs.id : false;
    node.forEach((childNode, offset, childIndex) => {
        if ((!childNode.isAtom || isElementNode(childNode)) &&
            childNode.attrs.id &&
            !isExcluded(childNode.type)) {
            items.push(buildTree({
                node: childNode,
                pos: startPos + offset,
                index: childIndex,
                selected,
                parent: node,
            }));
        }
    });
    return { node, index, items, pos, endPos, parent, isSelected };
};
class Tree extends React.Component {
    constructor(props) {
        super(props);
        this.outlineStyles = (isDragging) => ({
            opacity: isDragging ? 0.5 : 1,
        });
        this.bottomPreviewStyles = (mightDrop, dragPosition) => ({
            bottom: '-1px',
            visibility: mightDrop && dragPosition === 'after' ? 'visible' : 'hidden',
        });
        this.topPreviewStyles = (mightDrop, dragPosition) => ({
            top: '0px',
            visibility: mightDrop && dragPosition === 'before' ? 'visible' : 'hidden',
        });
        this.toggle = () => {
            this.setState({
                open: !this.state.open,
            });
        };
        this.itemText = (node) => {
            const text = nodeTitle(node);
            if (text) {
                return text.trim();
            }
            const placeholder = nodeTitlePlaceholder(node.type);
            return React.createElement(OutlineItemPlaceholder, null, placeholder);
        };
        this.handleContextMenu = event => {
            event.preventDefault();
            event.stopPropagation();
            const menu = this.createMenu();
            menu.showEditMenu(event.currentTarget);
        };
        this.createMenu = () => {
            const { tree, view } = this.props;
            return new ContextMenu(tree.node, view, () => tree.pos - 1);
        };
        this.state = {
            open: !props.depth,
            dragPosition: null,
        };
    }
    render() {
        const { depth = 0, tree, canDrop, connectDragSource, connectDragPreview, connectDropTarget, isDragging, isOverCurrent, item, view, } = this.props;
        const { open, dragPosition } = this.state;
        const { node, requirementsNode, items, isSelected } = tree;
        const mightDrop = item && isOverCurrent && canDrop;
        return connectDropTarget(React.createElement("div", null,
            React.createElement(Outline, { style: this.outlineStyles(isDragging) },
                React.createElement(OutlineDropPreview, { depth: depth, style: this.topPreviewStyles(mightDrop, dragPosition) }),
                connectDragSource(React.createElement("div", null,
                    React.createElement(OutlineItem, { isSelected: isSelected, depth: depth, onContextMenu: this.handleContextMenu },
                        items.length ? (React.createElement(OutlineItemArrow, { onClick: this.toggle }, open ? (React.createElement(StyledTriangleExpanded, null)) : (React.createElement(StyledTriangleCollapsed, null)))) : (React.createElement(OutlineItemNoArrow, null)),
                        React.createElement(OutlineItemLink, { to: `#${node.attrs.id || ''}` },
                            connectDragPreview(React.createElement("span", { style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                } },
                                React.createElement(OutlineItemIcon, null, nodeTypeIcon(node.type)))),
                            React.createElement(OutlineItemLinkText, { className: `outline-text-${node.type.name}` }, this.itemText(node)),
                            React.createElement(RequirementsAlert, { node: requirementsNode || node }))))),
                items.length ? (React.createElement("div", { style: { display: open ? '' : 'none' } }, items.map(subtree => (React.createElement(DraggableTree, Object.assign({}, this.props, { key: subtree.node.attrs.id, tree: subtree, view: view, depth: depth + 1 })))))) : null,
                React.createElement(OutlineDropPreview, { depth: depth, style: this.bottomPreviewStyles(mightDrop, dragPosition) }))));
    }
}
const dragType = 'outline';
const dragSourceSpec = {
    beginDrag(props) {
        return {
            tree: props.tree,
        };
    },
    canDrag(props) {
        return !!props.tree.parent;
    },
};
const dropTargetSpec = {
    canDrop(props, monitor) {
        const item = monitor.getItem();
        if (!props.tree.parent) {
            return false;
        }
        if (item.tree.node.attrs.id === props.tree.node.attrs.id) {
            return false;
        }
        if (item.tree.pos <= props.tree.pos &&
            item.tree.endPos >= props.tree.endPos) {
            return false;
        }
        const index = item.position === 'before' ? props.tree.index : props.tree.index + 1;
        return props.tree.parent.canReplace(index, index, Fragment.from(item.tree.node));
    },
    hover(props, monitor, component) {
        if (!monitor.isOver({ shallow: true }))
            return;
        const node = findDOMNode(component);
        const { bottom, top } = node.getBoundingClientRect();
        const offset = monitor.getClientOffset();
        if (!offset)
            return;
        const verticalMiddle = (bottom - top) / 2;
        const verticalHover = offset.y - top;
        const item = monitor.getItem();
        item.position = verticalHover < verticalMiddle ? 'before' : 'after';
        component.setState({
            dragPosition: item.position,
        });
    },
    drop(props, monitor) {
        if (monitor.didDrop())
            return;
        const item = monitor.getItem();
        const source = item.tree;
        const target = props.tree;
        const side = item.position;
        const insertPos = side === 'before' ? target.pos - 1 : target.pos + target.node.nodeSize - 1;
        let sourcePos = source.pos - 1;
        const tr = props.view.state.tr.insert(insertPos, source.node);
        sourcePos = tr.mapping.map(sourcePos);
        tr.delete(sourcePos, sourcePos + source.node.nodeSize);
        props.view.dispatch(tr);
    },
};
const dragSourceCollector = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
    canDrag: monitor.canDrag(),
    item: monitor.getItem(),
});
const dropTargetCollector = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
});
const dragSource = DragSource(dragType, dragSourceSpec, dragSourceCollector);
const dropTarget = DropTarget(dragType, dropTargetSpec, dropTargetCollector);
const DraggableTree = dragSource(dropTarget(Tree));
export default DraggableTree;
