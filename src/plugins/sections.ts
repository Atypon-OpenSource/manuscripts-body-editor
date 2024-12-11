/*!
 * © 2019 Atypon Systems LLC
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
import {
  isGraphicalAbstractSectionNode,
  isKeywordsNode,
  isSectionTitleNode,
} from '@manuscripts/transform'
import { Plugin, Transaction } from 'prosemirror-state'
import { ReplaceAroundStep, ReplaceStep } from 'prosemirror-transform'

/**
 * This plugin ensures that every section contains at least one child element, inserting a paragraph element after the title if needed.
 */

const preventTitleEdit = (tr: Transaction) => {
  /*
   Prevent
   - graphical abstract section title and
   - keywords section title
   from being changed/removed
  */
  let dontPrevent = true

  const isInRange = (start: number, end: number, position: number) =>
    position >= start && position <= end

  // Click on 'Delete section' in the context menu should not be prevented
  if (tr.getMeta('fromContextMenu')) {
    return dontPrevent
  }

  if (tr.getMeta('origin') === trackChangesPluginKey) {
    return dontPrevent
  }
  if (tr.getMeta('track-changes-skip-tracking')) {
    return dontPrevent
  }

  const hasReplaceAroundSteps = tr.steps.some(
    (step) => step instanceof ReplaceAroundStep
  )

  if (!hasReplaceAroundSteps) {
    tr.steps.forEach((step, i) => {
      if (!(step instanceof ReplaceStep)) {
        return
      }

      const currentDoc = tr.docs[i]
      step.getMap().forEach((fromA, toA) => {
        currentDoc.nodesBetween(fromA, toA, (node, nodePos) => {
          /* detecting if there is a change inside the title of
           - the graphical abstract section OR
           - the keywords section
           and preventing that change
           */
          if (isGraphicalAbstractSectionNode(node) || isKeywordsNode(node)) {
            const nodeRangeStart = nodePos
            const nodeRangeEnd = nodePos + node.nodeSize

            // Detect if the change is a deletion (complete removal of the node)
            const isDeletion = fromA <= nodeRangeStart && toA >= nodeRangeEnd

            if (isDeletion) {
              // Allow deletion of the node
              return true
            }

            // Prevent updates to the section title in graphical abstract or keywords
            node.descendants((childNode, childPos) => {
              const inDocPos = nodePos + childPos

              if (
                isSectionTitleNode(childNode) &&
                (isInRange(inDocPos, inDocPos + childNode.nodeSize, toA) ||
                  isInRange(inDocPos, inDocPos + childNode.nodeSize, fromA))
              ) {
                dontPrevent = false
                return dontPrevent
              }
            })
          }
        })
      })
    })
  }

  return dontPrevent
}

export default () => {
  return new Plugin<null>({
    filterTransaction: (tr) => {
      return preventTitleEdit(tr)
    },
    /*
      This is commented because after recent major dependencies update it somehow doesn't work well with the new track changes: RangeError due to paragraph adding into the title.
      It is also a bit fuzzy how it will affect the history.
    */
    // appendTransaction: (transactions, oldState, newState) => {
    //   const positionsToInsert: number[] = []

    //   const tr = newState.tr

    //   // if (!transactions.some(tr => tr.docChanged)) return null

    //   newState.doc.descendants((node, pos) => {
    //     if (!isSectionNode(node)) {
    //       return false
    //     }

    //     // add a paragraph to sections with only titles
    //     if (node.childCount === 1) {
    //       const childNode = node.child(0)

    //       if (childNode.type === childNode.type.schema.nodes.section_title) {
    //         positionsToInsert.push(pos + node.nodeSize - 1)
    //       }
    //     }
    //   })

    //   // return the transaction if something changed
    //   if (positionsToInsert.length) {
    //     // execute the inserts in reverse order so the positions don't change
    //     positionsToInsert.reverse()

    //     for (const pos of positionsToInsert) {
    //       const paragraph = newState.schema.nodes.paragraph.create()
    //       tr.insert(pos, paragraph)
    //     }
    //     tr.setMeta('origin', 'sections')
    //     return tr
    //   }
    // },
  })
}
