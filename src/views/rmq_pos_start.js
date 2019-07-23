import { BaseNodeView } from './base_node_view';
import { createNodeView } from './creators';
export class RMQPOSStartView extends BaseNodeView {
    constructor() {
        super(...arguments);
        this.initialise = () => {
            this.createDOM();
            this.updateContents();
        };
        this.updateContents = () => {
            const { commentId } = this.node.attrs;
            this.dom.dataset.rmqCommentId = commentId;
        };
        this.createDOM = () => {
            this.dom = document.createElement('rmq_pos_start');
            this.contentDOM = this.dom;
        };
    }
}
export default createNodeView(RMQPOSStartView);
