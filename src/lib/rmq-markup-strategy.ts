
import {EditorState,Transaction} from "prosemirror-state"
import {Node, Fragment, Slice, Schema} from "prosemirror-model"


import {
  ManuscriptSchema,
  ManuscriptEditorView,
  ManuscriptNode
} from '@manuscripts/manuscript-transform'


interface SerializedNode{
  type:string,
  attrs:{[key:string]:any}
}
export function getRandomId() {
  return (new Date()).getTime() + "_" + Math.floor(Math.random() * (100 - 1)) + 1;
}
export interface CommentPlacingStrategy<S extends Schema = any> {

  setTransaction(transaction:Transaction): CommentPlacingStrategy;

  updateCommentMark(commentId:string,oldCommentId:string,access:number,oldAccess:number,groupId:string | boolean,oldGroupId:string | boolean,from:number,to:number):void
  removeCommentMark(commentId:string,access:number,groupId:string | boolean,from:number,to:number):void
  addCommentMark(commentId:string,access:number,groupId:string | boolean,from:number,to:number):void

  findNodeById(commentId:string,exhaustive?:boolean):Array<{node:Node | null,pos:number | null}>;

  findCommentsInNodes(nodes:Array<SerializedNode>):{[key:string]:{access:number,groupId?:string | false}}
}

abstract class SchemaCommentPlacingStrategy implements CommentPlacingStrategy<ManuscriptSchema> {
  protected view:ManuscriptEditorView;
  protected state:EditorState<ManuscriptSchema>;
  protected myDoc:ManuscriptNode;
  protected schema:ManuscriptSchema;

  protected transaction:Transaction;

  protected constructor(view:ManuscriptEditorView){
    this.view = view;
    this.state = this.view.state;
    this.myDoc = this.state.doc;
    this.schema = this.state.schema;
  }

  public setTransaction(transaction:Transaction): CommentPlacingStrategy {
    this.transaction = transaction;
    return this;
  }

  protected findNode(tag:string | null,commentId:string,exhaustive?:boolean):Array<{
    node:Node | null,
    pos:number
  }>{
    let found:Array<{node:Node | null,pos:number}> = [];
    let predicate:((a:Node) => boolean ) = (node:Node)=>{
      const nodeType = node.type;
      const nodeName = nodeType.name;

      if (!tag || nodeName === tag){
        const _commentId = node.attrs.commentId;
        if (commentId === _commentId){
          return true;
        }
      }
      return false;
    };
    this.myDoc.descendants((node:Node, pos:number) => {
      if (predicate(node)){
        found.push({node, pos})
      }
      if (found && !exhaustive){
        return false;
      }
    });
    return found[0]?found : [{node:null,pos:-1}];
  }
  findNodeById(commentId:string,exhaustive?:boolean):Array<{node:Node | null,pos:number | null}> {
    return this.findNode(null,commentId,exhaustive);
  }

  abstract addCommentMark(commentId: string, access: number, groupId: string | boolean | null, from?: number, to?: number): void;

  abstract removeCommentMark(commentId: string, access: number, groupId?: string | boolean, from?: number, to?: number): void;

  abstract updateCommentMark(commentId: string, oldCommentId: string, access: number, oldAccess: number, groupId: string | boolean, oldGroupId: string | boolean, from: number, to: number): void;

  abstract findCommentsInNodes(nodes:Array<SerializedNode>):{[key:string]:{access:number,groupId?:string | false}};
}

/**
 * MarkerCommentPlacingStrategy puts designated nodes <rmq_pos_start data-rmq-commentId="..."/> .... <rmq_pos_end data-rmq-commentId="..."/>
 * in the document. The markers have their DOM defined in proseMirror.ts.
 * Since we probalby need to somehow highliught
 * pros:
 * 1. the markers are stored with the document, but do not distort the document too much
 * 2. The markers could be moved around
 * 3. Adding text inside the selected area is effortless as the markers do not move
 * cons:
 * 1. We need special handling when the user cuts - pastes text , probably we need to create a new set of markers for the selection
 * 2. Could get into a case where the start marker has been lost but the end marker not
 */
export class MarkerCommentPlacingStrategy extends  SchemaCommentPlacingStrategy{

  constructor(view:ManuscriptEditorView){
    super(view);
  }

  findNodeById(commentId: string,exhaustive?:boolean) {
    return this.findNode(null,commentId,exhaustive);
  }

  private addCommentNodes(commentId:string,access:number,groupId?:string | false){
    let startNode:Node = this.schema.nodes.rmq_pos_start.create({
      commentId:commentId,
      access:access,
      groupId:groupId
    });

    let endNode:Node = this.schema.nodes.rmq_pos_end.create({
      commentId:commentId,
      access:access,
      groupId:groupId
    });

    return {startNode,endNode};

  }

  private addCommentSlices(commentId:string,access:number,groupId?:string | false):{
    startSlice:Slice,
    endSlice:Slice
  } {

    const {startNode,endNode} = this.addCommentNodes(commentId,access,groupId);
    let startFragment:Fragment = Fragment.from(startNode);
    let startSlice:Slice = new Slice(startFragment,0,0);

    let endFragment:Fragment = Fragment.from(endNode);
    let endSlice:Slice = new Slice(endFragment,0,0);

    return {startSlice,endSlice};
  }




  addCommentMark(commentId:string,access:number,groupId:string | false,from:number,to:number){
    const {node:startNode} = this.findNode("rmq_pos_start",commentId)[0];
    const {node:endNode} = this.findNode("rmq_pos_end",commentId)[0];

    if(startNode ==null && endNode ==null) {

      const {startNode, endNode} = this.addCommentNodes(commentId, access, groupId);

      // let startStep = new ReplaceStep(from, from, startSlice);
      //
      // let stepMap = startStep.getMap();
      // const newTo = stepMap.map(to);
      //
      //
      // let endStep = new ReplaceStep(newTo, newTo, endSlice);

      this.transaction.insert(from,startNode);
      let stepMap = this.transaction.mapping;
      const newTo = stepMap.map(to);
      this.transaction.insert(newTo,endNode);
    }else if (startNode == null){
      return [];
    }else if (endNode == null){
      return [];
    }else{
      return [];
    }
  }


  removeCommentMark(commentId:string,access?:number,groupId?:string | false,from?:number,to?:number){
    const {pos:startPos} = this.findNode("rmq_pos_start",commentId)[0];
    const {pos:endPos} = this.findNode("rmq_pos_end",commentId)[0];

    // let endStep = new ReplaceStep(endPos,endPos,Slice.empty);
    // let startStep = new ReplaceStep(startPos,startPos,Slice.empty);
    //
    // return [endStep,startStep];
    this.transaction.delete(endPos,endPos).delete(startPos,startPos);
  }

  updateCommentMark(commentId:string,oldCommentId:string,access:number,oldAccess:number,groupId:string | false,oldGroupId:string | false,from?:number,to?:number){
    const {pos:startPos} = this.findNode("rmq_pos_start",oldCommentId)[0];
    const {pos:endPos} = this.findNode("rmq_pos_end",oldCommentId)[0];

    const {startSlice,endSlice} = this.addCommentSlices(commentId, access, groupId);

    // let endStep = new ReplaceStep(endPos,endPos,endSlice);
    // let startStep = new ReplaceStep(startPos,startPos,startSlice);
    //
    // return [endStep,startStep];
    this.transaction.replace(endPos,endPos,endSlice).replace(startPos,startPos,startSlice);
  }

  findCommentsInNodes(nodes:Array<SerializedNode>){
    return nodes.reduce((acc:{[key:string]:{access:number,groupId:string | false}},node)=>{
      const nodeName = node.type;
      if (nodeName === 'rmq_pos_start' || nodeName === 'rmq_pos_end'){
        const commentId = node.attrs.commentId;
        const access = node.attrs.access;
        const groupId = node.attrs.groupId;
        acc[commentId] = {access,groupId};
      }
      return acc;
    },{});
  }
}

/**
 * MarkupCommentPlacingStrategy changes the document by adding markup to the nodes.
 * Given a (from,to) range, the MarkupCommentPlacingStrategy uses the AddMarkupStep to wrap the range in a rmq node
 * pros:
 * 1. Cutting / pasting the range is handled automatically by proseMirror
 * cons:
 * 1. Too much distortion to the original document, could become difficult to merge
 */
export class MarkupCommentPlacingStrategy extends  SchemaCommentPlacingStrategy{

  constructor(view:ManuscriptEditorView){
    super(view);
  }

  findNodeById(commentId: string,exhaustive?:boolean) {
    return this.findNode("rmq",commentId,exhaustive);
  }

  addCommentMark(commentId:string,access:number,groupId:string | false,from:number,to:number){

    let commentMark = this.schema.mark('rmq',{
      commentId:commentId,
      access:access !=null ? access : -1,
      groupId:groupId
    });
    // let addMarkStep = new AddMarkStep(from,to,commentMark);
    //
    // return [addMarkStep];
    this.transaction.addMark(from,to,commentMark);
  }

  removeCommentMark(commentId:string,access:number,groupId:string | false,from:number,to:number){
    let commentMark = this.schema.mark('rmq', {
      commentId: commentId,
      access: access,
      groupId: groupId
    });
    // let removeMark = new RemoveMarkStep(from, to, commentMark);
    //
    // return [removeMark];
    this.transaction.removeMark(from,to,commentMark);
  }

  updateCommentMark(commentId:string,oldCommentId:string,access:number,oldAccess:number,groupId:string | false,oldGroupId:string | false,from:number,to:number){
    const commentMarkOld = this.schema.mark('rmq', {
      commentId: oldCommentId,
      access: oldAccess,
      groupId: oldGroupId
    });
    // let removeMark = new RemoveMarkStep(from, to, commentMark);

    const commentMarkNew = this.schema.mark('rmq', {
      commentId: commentId,
      access: access,
      groupId: groupId
    });
    // let addMark = new AddMarkStep(from, to, commentMark);
    // return [removeMark,addMark];
    this.transaction.removeMark(from,to,commentMarkOld).addMark(from,to,commentMarkNew);
  }

  findCommentsInNodes(nodes:Array<SerializedNode>) {
    return {}
  }
}

/**
 * MetaStorageCommentPlacingStrategy puts metadata to the transaction  and delegates the task of rendering the markup to the plugin
 * This cannot achieve production level: In such a case, the plugin would have the necessary information there.
 * pros:
 * 1. No distortion to the content whatsoever.
 * cons:
 * 1. Need to have a way to identify how ranges change while two versions of the document are merged
 */
export class MetaStorageCommentPlacingStrategy extends  SchemaCommentPlacingStrategy{
  constructor(view:ManuscriptEditorView){
    super(view);
  }

  findNodeById(commentId: string) {
    return [{node: null, pos: null}];
  }

  addCommentMark(commentId: string, access: number, groupId: string | boolean, from: number, to: number): void {
    const commentMeta = (this.transaction.getMeta('comments') || {});
    commentMeta[commentId] = {from,to,access,groupId};
    this.transaction.setMeta('comments',(commentMeta));
  }

  removeCommentMark(commentId: string, access: number, groupId: string | boolean, from: number, to: number): void {
    const commentMeta = (this.transaction.getMeta('comments') || {});
    delete commentMeta[commentId];
    this.transaction.setMeta('comments',(commentMeta));

    const removedCommentMeta = (this.transaction.getMeta('removedComments') || []);
    removedCommentMeta.push(commentId);
    this.transaction.setMeta('removedComments',(removedCommentMeta));
  }

  updateCommentMark(commentId: string, oldCommentId: string, access: number, oldAccess: number, groupId: string | boolean, oldGroupId: string | boolean, from: number, to: number): void {
    const commentMeta = (this.transaction.getMeta('comments') || {});
    delete commentMeta[oldCommentId];
    commentMeta[commentId] = {from,to,access,groupId};
    this.transaction.setMeta('comments',(commentMeta));

    const removedCommentMeta = (this.transaction.getMeta('removedComments') || []);
    removedCommentMeta.push(oldCommentId);
    this.transaction.setMeta('removedComments',(removedCommentMeta));
  }

  findCommentsInNodes(nodes:Array<SerializedNode>) {
    return {};
  }

}
