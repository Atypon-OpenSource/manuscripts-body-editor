import { Fragment, Slice, Node } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { getTableElementNode, updateSliceWithFullTableContent } from './table'
import { schema } from '@manuscripts/transform'

export const transformCopied = (slice: Slice, view: EditorView): Slice => {
    const { state } = view;
    const { from, to } = state.selection
    if ((!view.props.handleKeyDown || !state.selection.empty) && slice.content.firstChild?.type === schema.nodes.table) {
      let tableStart: number | null = null;
      let tableNode: Node | null = null;
  
      // Find the table_element node that contains the copied content
      state.doc.nodesBetween(from, to, (node: Node, pos: number) => {
        if (node.type === schema.nodes.table_element) {
          const nodeEnd = pos + (node.nodeSize || 0);
          if (pos <= from && nodeEnd >= to) {
            const tableElement = getTableElementNode(state);
            tableStart = tableElement.tableStart;
            tableNode = tableElement.tableNode;
            // Dispatch a transaction to update the selection to include the whole table_element
            if (tableNode && tableStart) {
              view.dispatch(
                state.tr.setSelection(
                  TextSelection.create(
                    state.doc,
                    tableStart,
                    tableStart + tableNode.nodeSize
                  )
                )
              );
            }
            return false;
          }
        }
        return true;
      });
      if (tableNode) {
        return new Slice(
          Fragment.from(tableNode),
          0,
          0
        );
      }
    }
  
    // handle case when part of the copied content is a table
    if (slice.content.firstChild?.type === schema.nodes.body) {
      let newSliceContent:Node[]  = [];
      slice.content.firstChild.descendants((node) => {
        if (node.childCount > 1) {
          newSliceContent = updateSliceWithFullTableContent(state, node.content);
          return false;
        }
        if (newSliceContent.length > 0) {
          return false;
        }
        return true;
      });
      if (newSliceContent.length > 0) {
      return new Slice(
        Fragment.from(newSliceContent),
        0,
        0
      );
    }
    }
  
    return slice;
  };