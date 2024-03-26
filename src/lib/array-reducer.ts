/*!
 * © 2024 Atypon Systems LLC
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

export type Update<T> = {
  type: 'update'
  items: T[]
}

export type Delete<T> = {
  type: 'delete'
  item: T
}

export type Set<T> = {
  type: 'set'
  state: T[]
}

export type Action<T> = Update<T> | Delete<T> | Set<T>

export const arrayReducer = <T>(
  isEqual: (a: T, b: T) => boolean = (a, b) => a === b
) => {
  return (state: T[], action: Action<T>): T[] => {
    const handleUpdate = (state: T[], items: T[]): T[] => {
      const copy = [...state]
      items.forEach((item) => {
        const index = copy.findIndex((i) => isEqual(item, i))
        if (index >= 0) {
          copy[index] = item
        } else {
          copy.push(item)
        }
      })
      return copy
    }
    const handleDelete = (state: T[], item: T): T[] => {
      return state.filter((i) => !isEqual(item, i))
    }

    switch (action.type) {
      case 'update':
        return handleUpdate(state, action.items)
      case 'delete':
        return handleDelete(state, action.item)
      case 'set':
        return action.state
    }
  }
}
