/*!
 * © 2025 Atypon Systems LLC
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

import { Shortcut, ShortcutConnector } from '@manuscripts/style-guide'
import React, { JSX } from 'react'

import { isMac } from '../../lib/platform'

const keyMap: Record<string, React.ReactNode> = {
  CommandOrControl: isMac ? '⌘' : 'Ctrl',
  Option: isMac ? '⌥' : 'Alt',
  Shift: isMac ? '⇧' : 'Shift',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  BracketLeft: '[',
  BracketRight: ']',
  Escape: 'Esc',
  Tab: 'Tab',
  Enter: '↵',
}

export const formattedShortCut = (accelerator: string): JSX.Element => {
  const parts = accelerator.split('+').map((p) => p.trim())

  return (
    <>
      {parts.map((part, index) => {
        const content = keyMap[part] ?? part

        return (
          <React.Fragment key={`${part}-${index}`}>
            <Shortcut>{content}</Shortcut>
            {index < parts.length - 1 && (
              <ShortcutConnector>+</ShortcutConnector>
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}
