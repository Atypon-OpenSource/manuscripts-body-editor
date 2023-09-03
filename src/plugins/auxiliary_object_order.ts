/*!
 * © 2022 Atypon Systems LLC
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
import { ElementsOrder, Model, ObjectTypes } from '@manuscripts/json-schema'
import {
  AuxiliaryObjects,
  buildElementsOrder,
  getElementsOrder,
  getModelsByType,
} from '@manuscripts/transform'
import { isEqual } from 'lodash-es'
import { Plugin, PluginKey, Transaction } from 'prosemirror-state'

import { modelsKey as modelMapKey } from './models'

interface Props {
  getModelMap: () => Map<string, Model>
}

type AuxiliaryObjectsOrder = {
  [key in AuxiliaryObjects]: ElementsOrder
}

export const modelsKey = new PluginKey<AuxiliaryObjectsOrder>(
  'auxiliary_elements_order'
)

/**
 *  This plugin will maintain the order of auxiliary objects.
 *  and before checking difference between current and new state,
 *  will check if document get changed. then will find auxiliary object
 *  with difference to update state of the order object.
 */
export default (props: Props) =>
  new Plugin<AuxiliaryObjectsOrder>({
    key: modelsKey,
    state: {
      init: () => getAuxiliaryObjects(props.getModelMap()),
      apply: (tr, value, oldState, newState) => {
        const state = modelsKey.getState(newState)
        if (!state) {
          return getAuxiliaryObjects(props.getModelMap())
        }
        return state
      },
    },
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((transaction) => transaction.docChanged)) {
        return null
      }
      let state = modelsKey.getState(newState) as AuxiliaryObjectsOrder

      if (!state) {
        state = getAuxiliaryObjects(props.getModelMap())
      }

      const elementsOrder = getElementsOrder(newState.doc).reduce(
        (elements, obj) => ({ ...elements, [obj.elementType]: obj.elements }),
        {}
      )
      const stateElementsOrder = Object.values(state).reduce(
        (elements, obj) => ({ ...elements, [obj.elementType]: obj.elements }),
        {}
      )

      if (!isEqual(stateElementsOrder, elementsOrder)) {
        let tr: Transaction | undefined
        Object.entries(elementsOrder).map(([key, elements]) => {
          const model =
            state[key as AuxiliaryObjects] ||
            buildElementsOrder(key as AuxiliaryObjects)
          if (!isEqual(model.elements, elements)) {
            tr = (tr || newState.tr).setMeta(modelMapKey, {
              ['UPDATE']: [{ ...model, elements }],
            })
          }
        })
        tr?.setMeta('origin', modelsKey)
        return tr
      }
      return null
    },
  })

const getAuxiliaryObjects = (modelMap: Map<string, Model>) =>
  getModelsByType<ElementsOrder>(modelMap, ObjectTypes.ElementsOrder).reduce(
    (obj, value) => ({ ...obj, [value.elementType]: value }),
    {}
  ) as AuxiliaryObjectsOrder
