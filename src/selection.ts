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
import { trackChangesPluginKey } from '@manuscripts/track-changes-plugin'
import { ManuscriptEditorState } from '@manuscripts/transform'
import { Node, ResolvedPos } from 'prosemirror-model'
import { Selection } from 'prosemirror-state'
import { Mappable } from 'prosemirror-transform'

import { isTextSelection } from './commands'

/**
 * Selecting multiple nodes without moving selection cursor
 */
export class NodesSelection extends Selection {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): any {
    return {
      type: 'inlineNodes',
      startNode: this.$startNode,
      endNode: this.$endNode,
    }
  }
}

export const getSelectionChangeGroup = (state: ManuscriptEditorState) => {
  const selection = state.selection
  const $pos = isTextSelection(selection)
    ? selection.$cursor
    : selection instanceof NodesSelection && selection.$from
  if ($pos) {
    return trackChangesPluginKey
      .getState(state)
      ?.changeSet.groupChanges.find(
        (changes) =>
          changes.length > 1 &&
          $pos.pos >= changes[0].from &&
          $pos.pos <= changes[changes.length - 1].to
      )
  }
}
