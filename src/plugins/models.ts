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

import { Model } from '@manuscripts/json-schema'
import { Build } from '@manuscripts/transform'
import { Plugin, PluginKey } from 'prosemirror-state'

export const modelsKey = new PluginKey('models')

export const INSERT = 'INSERT'
export const UPDATE = 'UPDATE'
export const REMOVE = 'REMOVE'

interface Props {
  saveModel: <T extends Model>(model: T | Build<T> | Partial<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
}

/**
 * This plugin allows commands that don't otherwise have access to the database to insert, remove or update models, by dispatching the model in a transaction.
 */
export default (props: Props) => {
  return new Plugin<Record<string, unknown>>({
    key: modelsKey,

    state: {
      init: () => {
        return {}
      },
      apply: (tr) => {
        const meta = tr.getMeta(modelsKey)

        if (meta) {
          if (meta[INSERT]) {
            meta[INSERT].forEach(props.saveModel)
          }

          if (meta[UPDATE]) {
            meta[UPDATE].forEach(props.saveModel)
          }

          if (meta[REMOVE]) {
            meta[REMOVE].forEach(props.deleteModel)
          }
        }

        return {}
      },
    },
  })
}
