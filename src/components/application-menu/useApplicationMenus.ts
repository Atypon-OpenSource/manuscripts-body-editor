/*!
 * © 2020 Atypon Systems LLC
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
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { getMenuItem, getMenuState } from './menuState'
import { MenuItem, MenuPointer, MenuSpec } from './types'

const initialPointer = [-1, -1, -1] as MenuPointer

const transformPointer = (depth: number, index: number) => (
  pointer: MenuPointer
) =>
  pointer.map((pointerPart, i) => {
    if (i === depth) {
      return index
    }
    if (i > depth) {
      return -1
    }
    return pointerPart
  }) as MenuPointer

export const prevValidItem = (menu: MenuItem[], current: number): number => {
  const prevIndex = current - 1
  if (prevIndex <= -1) {
    return -1
  }

  const prevItem = menu[prevIndex]
  if (prevItem.role !== 'separator' && prevItem.enable) {
    return prevIndex
  }

  return prevValidItem(menu, prevIndex)
}

export const nextValidItem = (menu: MenuItem[], current: number): number => {
  const nextIndex = current + 1
  if (nextIndex >= menu.length) {
    return 0
  }

  const nextItem = menu[nextIndex]
  if (nextItem.role !== 'separator' && nextItem.enable) {
    return nextIndex
  }

  return nextValidItem(menu, nextIndex)
}

export const useApplicationMenus = (menuSpec: MenuSpec[]) => {
  const [pointer, setPointer] = useState(initialPointer)
  const menuState = getMenuState(menuSpec, pointer)

  const toggleMenus = useCallback(() => {
    setPointer(pointer[0] === -1 ? [0, -1, -1] : [-1, -1, -1])
  }, [pointer])

  const handleItemClick = useCallback(
    (indices: number[]) => {
      const item = getMenuItem(menuState, indices)

      if (!item || !item.enable) {
        return
      }

      if (item.run) {
        item.run()
        setPointer([-1, -1, -1])
      } else if (item.submenu) {
        const depth = indices.length - 1
        const index = indices[depth]
        setPointer(transformPointer(depth, index))
      }
    },
    [menuState]
  )

  /*
   ** Ref to wrap the menu itself:
   */
  const wrapperRef = useRef<HTMLDivElement>(null)

  /*
   ** Binding key handlers
   */
  const handleKeydown = useCallback(
    /* tslint:disable-next-line:cyclomatic-complexity */
    (e: KeyboardEvent<HTMLDivElement>): boolean => {
      const { key } = e
      const [menuI, itemI, submenuItemI] = pointer

      if (key === 'Escape') {
        toggleMenus()
        return false
      } else if (menuI === -1) {
        // returning "true" allows the editor/default action to proceed
        return true
      }

      e.preventDefault()

      let menuItem
      let items

      switch (key) {
        case 'ArrowLeft':
          // if the pointer is currently on a submenu, set it back to the parent
          // menu item
          if (submenuItemI !== -1) {
            setPointer([menuI, itemI, -1])
            return false
          }
          setPointer(transformPointer(0, prevValidItem(menuState, menuI)))
          return false

        case 'ArrowRight':
          // if the pointer is on a menu item which has a submenu, but
          // the pointer is NOT on the submenu, ArrowRight should move the pointer
          // over to the submenu instead.
          if (itemI !== -1 && submenuItemI === -1) {
            menuItem = getMenuItem(menuState, pointer)
            if (!menuItem || !menuItem.submenu) {
              return false
            }
            setPointer(transformPointer(2, nextValidItem(menuItem.submenu, -1)))
            return false
          }
          setPointer(transformPointer(0, nextValidItem(menuState, menuI)))
          return false

        case 'ArrowUp':
          // if the pointer is on the submenu then the up and down
          // arrow keys navigate the submenu
          if (submenuItemI !== -1) {
            menuItem = getMenuItem(menuState, [menuI, itemI])
            items = menuItem && menuItem.submenu
            if (!items) {
              return false
            }
            setPointer(transformPointer(2, prevValidItem(items, submenuItemI)))
            return false
          }
          items = menuState[menuI].submenu
          if (!items) {
            return false
          }
          setPointer(transformPointer(1, prevValidItem(items, itemI)))
          return false

        case 'ArrowDown':
          // if the pointer is on the submenu then the up and down
          // arrow keys navigate the submenu
          if (submenuItemI !== -1) {
            menuItem = getMenuItem(menuState, [menuI, itemI])
            items = menuItem && menuItem.submenu
            if (!items) {
              return false
            }
            setPointer(transformPointer(2, nextValidItem(items, submenuItemI)))
            return false
          }
          items = menuState[menuI].submenu
          if (!items) {
            return false
          }
          setPointer(transformPointer(1, nextValidItem(items, itemI)))
          return false

        case 'Enter':
        case 'Space':
          handleItemClick(pointer)
          return false
      }

      return false
    },
    [menuState, handleItemClick, pointer, toggleMenus]
  )

  /*
   ** Bind click handler to close on click outside of the menu
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Element)
      ) {
        setPointer([-1, -1, -1])
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return {
    handleKeydown,
    toggleMenus,
    menuState,
    handleItemClick,
    isMenuOpen: pointer[0] > -1,
    wrapperRef,
  }
}
