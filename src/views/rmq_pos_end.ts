import { ManuscriptNodeView } from '@manuscripts/manuscript-transform'
import { ViewerProps } from '../components/Viewer'
import { BaseNodeView } from './base_node_view'
import { createNodeView } from './creators'



export class RMQPOSEndView<PropsType extends ViewerProps>
  extends BaseNodeView<PropsType>
  implements ManuscriptNodeView {
  public initialise = () => {
    this.createDOM()
    this.updateContents()
  }

  public updateContents = () => {
    const { commentId } = this.node.attrs
    this.dom.dataset.rmqCommentId = commentId;
  }

  protected createDOM = () => {
    this.dom = document.createElement('rmq_pos_end');
    this.contentDOM = this.dom
  }
}

export default createNodeView(RMQPOSEndView)
