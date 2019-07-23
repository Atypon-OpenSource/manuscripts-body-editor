import { Fragment, Slice } from "prosemirror-model";
export function getRandomId() {
    return (new Date()).getTime() + "_" + Math.floor(Math.random() * (100 - 1)) + 1;
}
class SchemaCommentPlacingStrategy {
    constructor(view) {
        this.view = view;
        this.state = this.view.state;
        this.myDoc = this.state.doc;
        this.schema = this.state.schema;
    }
    setTransaction(transaction) {
        this.transaction = transaction;
        return this;
    }
    findNode(tag, commentId, exhaustive) {
        let found = [];
        let predicate = (node) => {
            const nodeType = node.type;
            const nodeName = nodeType.name;
            if (!tag || nodeName === tag) {
                const _commentId = node.attrs.commentId;
                if (commentId === _commentId) {
                    return true;
                }
            }
            return false;
        };
        this.myDoc.descendants((node, pos) => {
            if (predicate(node)) {
                found.push({ node, pos });
            }
            if (found && !exhaustive) {
                return false;
            }
        });
        return found[0] ? found : [{ node: null, pos: -1 }];
    }
    findNodeById(commentId, exhaustive) {
        return this.findNode(null, commentId, exhaustive);
    }
}
export class MarkerCommentPlacingStrategy extends SchemaCommentPlacingStrategy {
    constructor(view) {
        super(view);
    }
    findNodeById(commentId, exhaustive) {
        return this.findNode(null, commentId, exhaustive);
    }
    addCommentNodes(commentId, access, groupId) {
        let startNode = this.schema.nodes.rmq_pos_start.create({
            commentId: commentId,
            access: access,
            groupId: groupId
        });
        let endNode = this.schema.nodes.rmq_pos_end.create({
            commentId: commentId,
            access: access,
            groupId: groupId
        });
        return { startNode, endNode };
    }
    addCommentSlices(commentId, access, groupId) {
        const { startNode, endNode } = this.addCommentNodes(commentId, access, groupId);
        let startFragment = Fragment.from(startNode);
        let startSlice = new Slice(startFragment, 0, 0);
        let endFragment = Fragment.from(endNode);
        let endSlice = new Slice(endFragment, 0, 0);
        return { startSlice, endSlice };
    }
    addCommentMark(commentId, access, groupId, from, to) {
        const { node: startNode } = this.findNode("rmq_pos_start", commentId)[0];
        const { node: endNode } = this.findNode("rmq_pos_end", commentId)[0];
        if (startNode == null && endNode == null) {
            const { startNode, endNode } = this.addCommentNodes(commentId, access, groupId);
            this.transaction.insert(from, startNode);
            let stepMap = this.transaction.mapping;
            const newTo = stepMap.map(to);
            this.transaction.insert(newTo, endNode);
        }
        else if (startNode == null) {
            return [];
        }
        else if (endNode == null) {
            return [];
        }
        else {
            return [];
        }
    }
    removeCommentMark(commentId, access, groupId, from, to) {
        const { pos: startPos } = this.findNode("rmq_pos_start", commentId)[0];
        const { pos: endPos } = this.findNode("rmq_pos_end", commentId)[0];
        this.transaction.delete(endPos, endPos).delete(startPos, startPos);
    }
    updateCommentMark(commentId, oldCommentId, access, oldAccess, groupId, oldGroupId, from, to) {
        const { pos: startPos } = this.findNode("rmq_pos_start", oldCommentId)[0];
        const { pos: endPos } = this.findNode("rmq_pos_end", oldCommentId)[0];
        const { startSlice, endSlice } = this.addCommentSlices(commentId, access, groupId);
        this.transaction.replace(endPos, endPos, endSlice).replace(startPos, startPos, startSlice);
    }
    findCommentsInNodes(nodes) {
        return nodes.reduce((acc, node) => {
            const nodeName = node.type;
            if (nodeName === 'rmq_pos_start' || nodeName === 'rmq_pos_end') {
                const commentId = node.attrs.commentId;
                const access = node.attrs.access;
                const groupId = node.attrs.groupId;
                acc[commentId] = { access, groupId };
            }
            return acc;
        }, {});
    }
}
export class MarkupCommentPlacingStrategy extends SchemaCommentPlacingStrategy {
    constructor(view) {
        super(view);
    }
    findNodeById(commentId, exhaustive) {
        return this.findNode("rmq", commentId, exhaustive);
    }
    addCommentMark(commentId, access, groupId, from, to) {
        let commentMark = this.schema.mark('rmq', {
            commentId: commentId,
            access: access != null ? access : -1,
            groupId: groupId
        });
        this.transaction.addMark(from, to, commentMark);
    }
    removeCommentMark(commentId, access, groupId, from, to) {
        let commentMark = this.schema.mark('rmq', {
            commentId: commentId,
            access: access,
            groupId: groupId
        });
        this.transaction.removeMark(from, to, commentMark);
    }
    updateCommentMark(commentId, oldCommentId, access, oldAccess, groupId, oldGroupId, from, to) {
        const commentMarkOld = this.schema.mark('rmq', {
            commentId: oldCommentId,
            access: oldAccess,
            groupId: oldGroupId
        });
        const commentMarkNew = this.schema.mark('rmq', {
            commentId: commentId,
            access: access,
            groupId: groupId
        });
        this.transaction.removeMark(from, to, commentMarkOld).addMark(from, to, commentMarkNew);
    }
    findCommentsInNodes(nodes) {
        return {};
    }
}
export class MetaStorageCommentPlacingStrategy extends SchemaCommentPlacingStrategy {
    constructor(view) {
        super(view);
    }
    findNodeById(commentId) {
        return [{ node: null, pos: null }];
    }
    addCommentMark(commentId, access, groupId, from, to) {
        const commentMeta = (this.transaction.getMeta('comments') || {});
        commentMeta[commentId] = { from, to, access, groupId };
        this.transaction.setMeta('comments', (commentMeta));
    }
    removeCommentMark(commentId, access, groupId, from, to) {
        const commentMeta = (this.transaction.getMeta('comments') || {});
        delete commentMeta[commentId];
        this.transaction.setMeta('comments', (commentMeta));
        const removedCommentMeta = (this.transaction.getMeta('removedComments') || []);
        removedCommentMeta.push(commentId);
        this.transaction.setMeta('removedComments', (removedCommentMeta));
    }
    updateCommentMark(commentId, oldCommentId, access, oldAccess, groupId, oldGroupId, from, to) {
        const commentMeta = (this.transaction.getMeta('comments') || {});
        delete commentMeta[oldCommentId];
        commentMeta[commentId] = { from, to, access, groupId };
        this.transaction.setMeta('comments', (commentMeta));
        const removedCommentMeta = (this.transaction.getMeta('removedComments') || []);
        removedCommentMeta.push(oldCommentId);
        this.transaction.setMeta('removedComments', (removedCommentMeta));
    }
    findCommentsInNodes(nodes) {
        return {};
    }
}
