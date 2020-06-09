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
  ManuscriptNode,
  ManuscriptNodeType,
  ManuscriptSchema,
  nodeNames,
  schema,
} from '@manuscripts/manuscript-transform'
import {
  AuxiliaryObjectReference,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
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

const labelledNodeTypes: ManuscriptNodeType[] = [
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

const labelProperties: Map<
  ManuscriptNodeType,
  keyof Partial<Manuscript>
> = new Map([
  [schema.nodes.figure_element, 'figureElementLabel'],
  [schema.nodes.table_element, 'tableElementLabel'],
  [schema.nodes.equation_element, 'equationElementLabel'],
  [schema.nodes.listing_element, 'listingElementLabel'],
])

const chooseLabel = (
  nodeType: ManuscriptNodeType,
  manuscript: Manuscript
): string => {
  const labelProperty = labelProperties.get(nodeType)

  if (labelProperty) {
    const label = manuscript[labelProperty]

    if (label) {
      return label as string
    }
  }

  return nodeNames.get(nodeType) as string
}

const buildTargets = (doc: ManuscriptNode, manuscript: Manuscript) => {
  const counters: Counters = {}

  for (const nodeType of labelledNodeTypes) {
    counters[nodeType.name] = {
      label: chooseLabel(nodeType, manuscript),
      index: 0, // TODO: use manuscript.figureElementNumberingScheme
    }
  }

  const buildLabel = (type: ManuscriptNodeType) => {
    const counter = counters[type.name]
    counter.index++
    return `${counter.label} ${counter.index}`
  }

  const targets: Map<string, Target> = new Map()

  doc.descendants((node) => {
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
  getManuscript: () => Manuscript
  getModel: <T extends Model>(id: string) => T | undefined
}

export default (props: Props) => {
  return new Plugin<Map<string, Target>, ManuscriptSchema>({
    key: objectsKey,

    state: {
      init: (config, state) => buildTargets(state.doc, props.getManuscript()),
      apply: (tr) => {
        // TODO: use decorations to track figure deletion?
        // TODO: map decorations?
        // TODO: use setMeta to update labels

        return buildTargets(tr.doc, props.getManuscript())
      },
    },
    props: {
      decorations: (state) => {
        const decorations: Decoration[] = []

        const targets = objectsKey.getState(state)

        if (targets) {
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
        }

        return DecorationSet.create(state.doc, decorations)
      },
    },
    appendTransaction: (transactions, oldState, newState) => {
      const targets = objectsKey.getState(newState)

      if (!targets) {
        return
      }

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
        return tr.setSelection(newState.selection.map(tr.doc, tr.mapping))
      }
    },
  })
}
