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
import { ManuscriptSchema } from '@manuscripts/manuscript-transform'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useEffect, useState } from 'react'

import { useTrackChangesContext } from './TrackChangesContext'

// Modified from https://github.com/bangle-io/bangle.dev/blob/master/react/hooks.jsx

const updatePluginWatcher = (
  view: EditorView,
  watcher: Plugin<any, ManuscriptSchema>,
  remove = false
) => {
  let state = view.state

  const newPlugins = remove
    ? state.plugins.filter((p) => p !== watcher)
    : [...state.plugins, watcher]

  state = state.reconfigure({
    plugins: newPlugins,
  })

  view.updateState(state)
}

export function usePluginState(pluginKey: PluginKey) {
  const { store } = useTrackChangesContext()
  const [state, setState] = useState(
    store.view ? pluginKey.getState(store.view.state) : null
  )

  useEffect(() => {
    const view = store.view
    if (!view) {
      return
    }
    const plugin = watcherPlugin(pluginKey, setState)
    updatePluginWatcher(view, plugin)
    return () => {
      updatePluginWatcher(view, plugin, true)
    }
  }, [store.view, pluginKey])

  return state
}

export function watcherPlugin(
  pluginKey: PluginKey,
  setState: (newState: any) => void
) {
  return new Plugin({
    // @ts-ignore
    key: new PluginKey(`withPluginState_${pluginKey.key}`),
    view() {
      return {
        update(view: EditorView, prevState: any) {
          const { state } = view
          if (prevState === state) {
            return
          }
          const newPluginState = pluginKey.getState(state)
          if (newPluginState !== pluginKey.getState(prevState)) {
            setState(newPluginState)
          }
        },
      }
    },
  })
}
