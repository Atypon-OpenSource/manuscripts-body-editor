/*!
 * © 2024 Atypon Systems LLC
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
  CHANGE_OPERATION,
  trackChangesPluginKey,
  TrackedChange,
} from '@manuscripts/track-changes-plugin'
import { ManuscriptEditorState } from '@manuscripts/transform'
import { Node, ResolvedPos } from 'prosemirror-model'
import { NodeSelection, Selection } from 'prosemirror-state'
import { Mappable } from 'prosemirror-transform'

import { isTextSelection } from './commands'

interface NodesSelectionJSON {
  type: 'inlineNodes' | 'nodes'
  startNode: ResolvedPos
  endNode: ResolvedPos
}

/**
 * Selecting multiple inline nodes without moving selection cursor
 */
export class InlineNodesSelection extends Selection {
  public $startNode: ResolvedPos
  public $endNode: ResolvedPos

  constructor($from: ResolvedPos, $to: ResolvedPos) {
    super($to, $to)
    this.$startNode = $from
    this.$endNode = $to
  }

  eq(selection: Selection): boolean {
    return (
      selection instanceof NodesSelection &&
      selection.$startNode.pos == this.$startNode.pos &&
      selection.$endNode.pos == this.$endNode.pos
    )
  }

  map(doc: Node, mapping: Mappable): Selection {
    const $from = doc.resolve(mapping.map(this.$startNode.pos))
    const $to = doc.resolve(mapping.map(this.$endNode.pos))
    return new NodesSelection($from, $to)
  }

  toJSON(): NodesSelectionJSON {
    return {
      type: 'inlineNodes',
      startNode: this.$startNode,
      endNode: this.$endNode,
    }
  }
}

export class NodesSelection extends NodeSelection {
  public $startNode: ResolvedPos
  public $endNode: ResolvedPos

  constructor($from: ResolvedPos, $to: ResolvedPos) {
    super($from)
    this.$startNode = $from
    this.$endNode = $to
  }

  toJSON(): NodesSelectionJSON {
    return {
      type: 'nodes',
      startNode: this.$startNode,
      endNode: this.$endNode,
    }
  }
}

export const getSelectionChangeGroup = (state: ManuscriptEditorState) => {
  const selection = state.selection
  const $pos = isTextSelection(selection)
    ? selection.$cursor
    : (selection instanceof NodesSelection ||
        selection instanceof InlineNodesSelection) &&
      selection.$from
  if ($pos) {
    return trackChangesPluginKey
      .getState(state)
      ?.changeSet.groupChanges.find((c) => isPositionAtRange(c, $pos.pos))
  }
}

// check if position is at the range of group changes
const isPositionAtRange = (changes: TrackedChange[], pos: number) =>
  (changes.length > 1 ||
    changes[0].dataTracked.operation === CHANGE_OPERATION.structure) &&
  pos >= changes[0].from &&
  pos <= changes[changes.length - 1].to
