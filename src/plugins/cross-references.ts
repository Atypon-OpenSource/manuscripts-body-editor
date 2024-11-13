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

import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { schema } from '@manuscripts/transform';

export default () => {
  return new Plugin({
    state: {
      init(_, state) {
        // Initialize decorations with an empty set
        return DecorationSet.empty;
      },
      apply(tr, oldState) {
        let decoSet = oldState;

        if (tr.docChanged) {
          const decorations: Decoration[] = [];
          tr.doc.descendants((node, pos) => {
            if (node.type === schema.nodes.cross_reference) {
              // Create a decoration that adds a class to the node
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: 'updated-' + Date.now(), // Add a unique class to the decoration
                })
              );
            }
          });

          // Create a new decoration set with the collected decorations
          decoSet = DecorationSet.create(tr.doc, decorations);
        }

        return decoSet;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}