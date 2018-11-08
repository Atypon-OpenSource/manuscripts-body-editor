import { ResolvedPos } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { findParentNodeClosestToPos } from 'prosemirror-utils'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { attentionIconHtml, SyncError, SyncErrors } from '../lib/sync-errors'
import {
  ManuscriptEditorState,
  ManuscriptNode,
  ManuscriptSchema,
} from '../schema/types'
import { isElementNode } from '../transformer/node-types'

export const syncErrorsKey = new PluginKey('sync-errors')

interface SyncErrorsPluginState {
  errors: SyncErrors | null
  decorations: DecorationSet
}

// Object mapping the node where we should display the error, to a list of
// componentIDs which have errors
interface NodeErrors {
  [componentID: string]: SyncError[]
}

const findTopLevelContainingNode = (
  pos: ResolvedPos,
  startNode: ManuscriptNode
) => {
  const predicate = (node: ManuscriptNode) => {
    return isElementNode(node) && node.attrs.id
  }

  if (predicate(startNode)) {
    return startNode.attrs.id
  }

  const result = findParentNodeClosestToPos(pos, predicate)

  if (result) {
    return result.node.attrs.id
  } else {
    throw new Error('Unable to locate top level containing node')
  }
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

          const nodeErrors: NodeErrors = {}

          newState.doc.descendants(
            (node: ManuscriptNode, pos: number, _parent: ManuscriptNode) => {
              if (!(node.attrs && node.attrs.id && node.attrs.id in errors)) {
                return
              }

              const error = errors[node.attrs.id]

              const id = findTopLevelContainingNode(
                newState.doc.resolve(pos),
                node
              )

              const existingErrors = nodeErrors[id]

              if (existingErrors) {
                existingErrors.push(error)
              } else {
                nodeErrors[id] = [error]
              }
            }
          )

          console.log('nodeErrors', nodeErrors)

          const decorations: Decoration[] = []

          // if (isVisibleElement(node.attrs.id)) {
          //   // TODO: should this be a widget?
          //   const attentionWidget = Decoration.widget(
          //     pos,
          //     (view: EditorView) => {
          //       const attentionIcon = document.createElement('span')
          //       attentionIcon.innerHTML = attentionIconHtml()
          //       attentionIcon.className = 'attention-icon'

          //       return attentionIcon
          //     }
          //   )

          //   decorations.push(attentionWidget)
          // }

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
