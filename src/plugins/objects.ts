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

import {
  AuxiliaryObjectReference,
  ManuscriptNode,
  ManuscriptNodeType,
  ManuscriptSchema,
  nodeNames,
  schema,
} from '@manuscripts/manuscript-transform'
import { Model } from '@manuscripts/manuscripts-json-schema'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface Target {
  type: string
  id: string
  label: string
  caption: string
}

export const objectsKey = new PluginKey<Map<string, Target>, ManuscriptSchema>(
  'objects'
)

// TODO: labels for "figure" (parts of a figure panel)

const types: ManuscriptNodeType[] = [
  schema.nodes.figure_element,
  schema.nodes.table_element,
  schema.nodes.equation_element,
  schema.nodes.listing_element,
]

interface Counter {
  label: string
  index: number
}

interface Counters {
  [key: string]: Counter
}

const buildTargets = (doc: ManuscriptNode) => {
  const counters: Counters = {}

  for (const type of types) {
    counters[type.name] = {
      label: nodeNames.get(type)!, // TODO: label from settings?
      index: 0,
    }
  }

  const buildLabel = (type: ManuscriptNodeType) => {
    const counter = counters[type.name]
    counter.index++
    return `${counter.label} ${counter.index}` // TODO: label from node.attrs.title?
  }

  const targets: Map<string, Target> = new Map()

  doc.descendants(node => {
    if (node.type.name in counters) {
      const label = buildLabel(node.type)

      targets.set(node.attrs.id, {
        type: node.type.name,
        id: node.attrs.id,
        label,
        caption: node.textContent, // TODO: HTML?
      })

      // TODO: allow an individual figure to be referenced
      // if (node.attrs.containedObjectIDs) {
      //   node.attrs.containedObjectIDs.forEach((containedObjectID: string) => {
      //     targets.set(containedObjectID, {
      //       type: '',
      //       id: containedObjectID,
      //       label,
      //       caption: '',
      //     })
      //   })
      // }
    }
  })

  return targets
}

interface Props {
  getModel: <T extends Model>(id: string) => T | undefined
}

export default (props: Props) => {
  return new Plugin<Map<string, Target>, ManuscriptSchema>({
    key: objectsKey,

    state: {
      init: (config, state) => buildTargets(state.doc),
      apply: (tr, old) => {
        // TODO: use decorations to track figure deletion?
        // TODO: map decorations?

        return tr.docChanged ? buildTargets(tr.doc) : old
      },
    },
    props: {
      decorations: state => {
        const targets: Map<string, Target> = objectsKey.getState(state)

        const decorations: Decoration[] = []

        state.doc.descendants((node, pos) => {
          const { id } = node.attrs

          if (id) {
            const target = targets.get(id)

            if (target) {
              const labelNode = document.createElement('span')
              labelNode.className = 'figure-label'
              labelNode.textContent = target.label + ':'

              node.forEach((child, offset) => {
                if (child.type.name === 'figcaption') {
                  decorations.push(
                    Decoration.widget(pos + 1 + offset + 1, labelNode, {
                      side: -1,
                      key: `figure-label-${id}-${target.label}`,
                    })
                  )
                }
              })
            }
          }
        })

        return DecorationSet.create(state.doc, decorations)
      },
    },
    appendTransaction: (transactions, oldState, newState) => {
      const targets: Map<string, Target> = objectsKey.getState(newState)

      let updated = 0

      const tr = newState.tr

      newState.doc.descendants((node, pos) => {
        if (node.type === newState.schema.nodes.cross_reference) {
          const auxiliaryObjectReference = props.getModel<
            AuxiliaryObjectReference
          >(node.attrs.rid)

          // TODO: handle missing objects?
          // https://gitlab.com/mpapp-private/manuscripts-frontend/issues/395
          if (
            auxiliaryObjectReference &&
            auxiliaryObjectReference.referencedObject
          ) {
            const target = targets.get(
              auxiliaryObjectReference.referencedObject
            )

            if (target && target.label && target.label !== node.attrs.label) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                label: target.label,
              })

              updated++
            }
          }
        }
      })

      if (updated) {
        return tr.setSelection(newState.selection)
      }
    },
  })
}
