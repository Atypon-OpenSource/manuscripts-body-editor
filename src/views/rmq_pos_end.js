import { BaseNodeView } from './base_node_view';
import { createNodeView } from './creators';
export class RMQPOSEndView extends BaseNodeView {
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
            this.dom = document.createElement('rmq_pos_end');
            this.contentDOM = this.dom;
        };
    }
}
export default createNodeView(RMQPOSEndView);
