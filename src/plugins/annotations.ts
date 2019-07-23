import {Manuscript, Model} from "@manuscripts/manuscripts-json-schema";
import {Plugin} from "prosemirror-state";
import {
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNode,
  ManuscriptSchema
} from "@manuscripts/manuscript-transform";
import {Decoration, DecorationSet} from "prosemirror-view";

interface Props {
  getModel: <T extends Model>(id: string) => T | undefined
  getManuscript: () => Manuscript
}

interface PluginState {}


function fromMarkers(state:ManuscriptEditorState){
  const decorations:Array<Decoration> = [];

  const startPositions:{[key:string]:Array<number>} = {};
  const endPositions:{[key:string]:Array<number>} = {};

  state.doc.descendants((node:ManuscriptNode, pos:number) => {
    if (node.type.name === 'rmq_pos_start'){
      const commentId = node.attrs.commentId;
      startPositions[commentId] = (startPositions[commentId] || []).concat(pos);
      return false;
    }else if (node.type.name === 'rmq_pos_end'){
      const commentId = node.attrs.commentId;
      endPositions[commentId] = (endPositions[commentId] || []).concat(pos);
      return false;
    }
  });

  Object.keys(startPositions).forEach(commentId=>{
    const starts = startPositions[commentId];
    const ends = endPositions[commentId];
    if (!ends){
      console.log("No end positions found for commentId:"+commentId);
      return;
    }
    if (starts.length !== ends.length){
      console.log(`commentId:${commentId} has ${starts.length} start markers and ${ends.length} markers`);
    }
    starts.sort();
    ends.sort();
    for (let i = 0;i<Math.min(starts.length,ends.length);i++){
      const startPos = starts[i];
      const endPos = ends[i];

      const decoration = Decoration.inline(startPos,endPos,{
        class:'rmq-annotator-hl rmq-annotator-hl-private'
      },{
        inclusiveStart:true,inclusiveEnd:true
      });
      decorations.push(decoration);
    }
  });
  return decorations;
}

export default (props: Props) => {
  return new Plugin<PluginState, ManuscriptSchema>({
    props: {
      decorations(state) {
        const decorationsFromMarkers = fromMarkers(state);
        return DecorationSet.create(state.doc,decorationsFromMarkers);
      },handleClickOn(view: ManuscriptEditorView,
                      pos: number,
                      node: ManuscriptNode,
                      nodePos: number,
                      event: MouseEvent,
                      direct: boolean){


        document.dispatchEvent(new CustomEvent('proseMirrorEditorClick',{
          detail:{
            node:node.toJSON(),
            event,pos,nodePos,direct
          }
        }));

        return true;

      }
    }
  })
}
