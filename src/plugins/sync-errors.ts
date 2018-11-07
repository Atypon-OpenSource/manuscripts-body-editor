import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { attentionIconHtml, SyncErrors } from '../lib/sync-errors'
import {
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '../schema/types'

export const syncErrorsKey = new PluginKey('sync-errors')

interface SyncErrorsPluginState {
  errors: SyncErrors | null
  decorations: DecorationSet
}

const isVisibleElement = (id: string) => {
  // TODO: write this code
  return id.includes('Element:')
}

export default () => {
  return new Plugin<ManuscriptSchema>({
    key: syncErrorsKey,
    state: {
      init: (): SyncErrorsPluginState => {
        return {
          errors: null,
          decorations: DecorationSet.empty,
        }
      },
      apply: (tr, pluginState, oldState, newState): SyncErrorsPluginState => {
        const errorsDoc: SyncErrors = tr.getMeta(syncErrorsKey)

        // New errors
        if (errorsDoc) {
          if (
            pluginState.errors &&
            errorsDoc._rev === pluginState.errors._rev
          ) {
            return pluginState
          }

          const { _id, _rev, ...errors } = errorsDoc

          const decorations: Decoration[] = []

          newState.doc.descendants((node: ManuscriptNode, pos: number) => {
            if (!(node.attrs && node.attrs.id && node.attrs.id in errors)) {
              return
            }

            const error = errors[node.attrs.id]

            if (isVisibleElement(node.attrs.id)) {
              // TODO: should this be a widget?
              const attentionWidget = Decoration.widget(
                pos,
                (view: EditorView) => {
                  const attentionIcon = document.createElement('span')
                  attentionIcon.innerHTML = attentionIconHtml()
                  attentionIcon.className = 'attention-icon'

                  return attentionIcon
                }
              )

              decorations.push(attentionWidget)
            }
          })

          return {
            decorations: DecorationSet.create(newState.doc, decorations),
            errors: errorsDoc,
          }
        }

        // Document changed, map any existing decorations through transaction
        return {
          decorations: pluginState.decorations.map(tr.mapping, tr.doc),
          errors: pluginState.errors,
        }
      },
    },
    props: {
      decorations(state: ManuscriptEditorState) {
        return syncErrorsKey.getState(state).decorations
      },
    },
  })
}
