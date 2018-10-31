import { Model } from '@manuscripts/manuscripts-json-schema'
import { Plugin, PluginKey } from 'prosemirror-state'
import { ManuscriptSchema } from '../schema/types'
import { Build } from '../transformer/builders'

export const modelsKey = new PluginKey('models')

export const INSERT = 'INSERT'
export const UPDATE = 'UPDATE'
export const REMOVE = 'REMOVE'

interface Props {
  saveModel: <T extends Model>(model: Build<T>) => Promise<T>
  deleteModel: (id: string) => Promise<string>
}

export default (props: Props) => {
  return new Plugin<ManuscriptSchema>({
    key: modelsKey,

    state: {
      init: () => {
        return null
      },
      apply: (transaction, pluginState) => {
        const meta = transaction.getMeta(modelsKey)

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

        return pluginState
      },
    },
  })
}
