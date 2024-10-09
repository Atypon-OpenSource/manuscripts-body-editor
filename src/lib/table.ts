import { Fragment, Schema, Slice, Node } from 'prosemirror-model'
import { EditorState} from 'prosemirror-state'
import {
    schema,
  } from '@manuscripts/transform'

export const updateSliceWithFullTableContent = (state: EditorState, slice: Fragment): Node[] =>{
    let newSliceContent: Node[] = [];
    slice.forEach((node) => {
      if (node.type === schema.nodes.table_element) {
        const {tableNode} = getTableElementNode(state);
        tableNode && newSliceContent.push(tableNode);
      } else {
        newSliceContent.push(node);
      }
    });
    return newSliceContent;
  }
  
export const getTableElementNode = (state: EditorState): {tableNode: Node | null, tableStart: number | null} => {
    const { from, to } = state.selection;
    let tableStart: number | null = null;
    let tableNode: Node | null = null
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === schema.nodes.table_element) {
        tableStart = pos;
        tableNode = node;
        return false;
      }
      return true;
    });
    return {tableNode, tableStart};
  }
export const createTableFromSlice = (slice: Slice, schema: Schema): Node | null => {
    const rows: Node[] = [];
    slice.content.forEach((node: Node) => {
      if (node.type === schema.nodes.table_row) {
        rows.push(node);
      } else if (node.type === schema.nodes.table_cell) {
        rows.push(schema.nodes.table_row.create(null, Fragment.from(node)));
      }
    });
  
    if (rows.length > 0) {
      return schema.nodes.table.create(null, rows);
    }
  
    return null;
  }