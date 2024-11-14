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
import { Selection, TextSelection } from 'prosemirror-state'
import { Mappable } from 'prosemirror-transform'

/**
 * This selection will preserve location of first and last inline node,
 * to help us for grouping them in selected-suggestion plugin without moving selection cursor
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
      selection instanceof InlineNodesSelection &&
      selection.$startNode.pos == this.$startNode.pos &&
      selection.$endNode.pos == this.$endNode.pos
    )
  }

  map(doc: Node, mapping: Mappable): Selection {
    const $from = doc.resolve(mapping.map(this.$startNode.pos))
    const $to = doc.resolve(mapping.map(this.$endNode.pos))
    return new InlineNodesSelection($from, $to)
  }

  toJSON(): any {
    return {
      type: 'inlineNodes',
      startNode: this.$startNode,
      endNode: this.$endNode,
    }
  }
}

export const isInlineNodesSelection = (selection: Selection) =>
  selection instanceof InlineNodesSelection

export const pointToInlineChanges = (state: ManuscriptEditorState) => {
  const selection = state.selection
  if (selection instanceof TextSelection && selection.$cursor) {
    const $cursor = selection.$cursor
    return trackChangesPluginKey
      .getState(state)
      ?.changeSet.changeTree.find(
        (change) =>
          change.type === 'inline-changes' &&
          $cursor.pos >= change.from &&
          $cursor.pos <= change.to
      )
  }
}
