/*!
 * © 2021 Atypon Systems LLC
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
import { PluginKey } from 'prosemirror-state'
import { useEffect, useRef, useState } from 'react'

import { useEditorContext } from '../context'

export function usePluginState<T>(pluginKey: PluginKey, debounce?: number) {
  const { pluginStateProvider } = useEditorContext()

  const [state, setState] = useState<T | null>(pluginStateProvider?.getPluginState(pluginKey))
  const timeout = useRef<NodeJS.Timeout | undefined>()
  const data = useRef<T | null>(null)

  useEffect(() => {
    const cb = (pluginState: T) => {
      if (debounce === undefined) {
        setState(pluginState)
      } else if (timeout.current) {
        data.current = pluginState
      } else {
        if (!data.current) {
          data.current = pluginState
        }
        timeout.current = setTimeout(() => {
          setState(data.current)
          data.current = null
          timeout.current = undefined
        }, debounce)
      }
    }
    setState(pluginStateProvider?.getPluginState(pluginKey))
    pluginStateProvider?.on(pluginKey, cb)
    return () => {
      pluginStateProvider?.off(pluginKey, cb)
    }
  }, [pluginKey, pluginStateProvider])

  return state
}
