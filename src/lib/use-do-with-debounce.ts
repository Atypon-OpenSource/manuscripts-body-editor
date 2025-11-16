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
import { useRef } from 'react'

export const useDoWithDebounce = () => {
  const debounced = useRef<() => void>(() => undefined)
  const timeout = useRef<number | undefined>(undefined)

  const doWithDebounce = (fn: () => void, interval = 1000, flush = false) => {
    debounced.current = fn

    if (flush) {
      fn()
      debounced.current = () => undefined
      window.clearTimeout(timeout.current)
    }

    window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => {
      debounced.current()
      timeout.current = 0
    }, interval)
  }

  return doWithDebounce
}
