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

import { MenuItem, MenuPointer, MenuSpec } from './types'

export const getMenuState = (
  spec: MenuSpec[],
  pointer: MenuPointer,
  depth = 0
): MenuItem[] => {
  const pointerPart = pointer[depth]

  /* tslint:disable-next-line:cyclomatic-complexity */
  return spec.map((itemSpec, index) => {
    return {
      id: itemSpec.id || '',
      role: itemSpec.role || '',
      accelerator: itemSpec.accelerator || null,
      label: itemSpec.label || '',
      active: itemSpec.active || false,
      enable: typeof itemSpec.enable === 'boolean' ? itemSpec.enable : true,
      run: itemSpec.run || null,
      submenu: itemSpec.submenu
        ? getMenuState(itemSpec.submenu, pointer, depth + 1)
        : null,
      isOpen: index === pointerPart,
    }
  })
}

export const getMenuItem = (
  menuState: MenuItem[],
  indices: number[]
): MenuItem | null => {
  const [head, ...tail] = indices.filter((item) => item !== -1)
  const item = menuState[head]

  if (!tail.length) {
    return item
  } else if (item.submenu) {
    return getMenuItem(item.submenu, tail)
  }

  return null
}
