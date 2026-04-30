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

/** Mirrors shortcut labels in `menus.tsx` and keymaps in `src/keys/` for the help dialog. */
import React from 'react'
import { Shortcut, ShortcutConnector } from '@manuscripts/style-guide'

export type EditorShortcutRow = {
  label: string
  shortcut: { mac: string; pc: string }
}

export type EditorShortcutSection = {
  title: string
  rows: EditorShortcutRow[]
}

export type EditorShortcutTab = {
  id: string
  label: string
  sections: EditorShortcutSection[]
}

export const EDITOR_KEYBOARD_SHORTCUT_TABS: EditorShortcutTab[] = [
  {
    id: 'text-editing',
    label: 'Text editing',
    sections: [
      {
        title: 'Formatting',
        rows: [
          {
            label: 'Bold',
            shortcut: { mac: 'CommandOrControl+B', pc: 'CommandOrControl+B' },
          },
          {
            label: 'Italic',
            shortcut: { mac: 'CommandOrControl+I', pc: 'CommandOrControl+I' },
          },
          {
            label: 'Underline',
            shortcut: { mac: 'CommandOrControl+U', pc: 'CommandOrControl+U' },
          },
          {
            label: 'Strikethrough',
            shortcut: {
              mac: 'CommandOrControl+Shift+X',
              pc: 'CommandOrControl+Shift+X',
            },
          },
          {
            label: 'Superscript',
            shortcut: {
              mac: 'Option+CommandOrControl+=',
              pc: 'CommandOrControl+Option+=',
            },
          },
          {
            label: 'Subscript',
            shortcut: {
              mac: 'Option+CommandOrControl+-',
              pc: 'CommandOrControl+Option+-',
            },
          },
        ],
      },
      {
        title: 'General',
        rows: [
          {
            label: 'Select all',
            shortcut: { mac: 'CommandOrControl+A', pc: 'CommandOrControl+A' },
          },
          {
            label: 'Undo',
            shortcut: { mac: 'CommandOrControl+Z', pc: 'CommandOrControl+Z' },
          },
          {
            label: 'Redo',
            shortcut: {
              mac: 'Shift+CommandOrControl+Z',
              pc: 'CommandOrControl+Y',
            },
          },
          {
            label: 'Activate search',
            shortcut: {
              mac: 'CommandOrControl+F',
              pc: 'CommandOrControl+F',
            },
          },
          {
            label: 'Activate search/replace',
            shortcut: {
              mac: 'CommandOrControl+Shift+H',
              pc: 'CommandOrControl+Shift+H',
            },
          },
          // {
          //   label: 'Keyboard shortcuts',
          //   shortcut: {
          //     mac: 'CommandOrControl+Shift+/',
          //     pc: 'CommandOrControl+Shift+/',
          //   },
          // },
        ],
      },
      {
        title: 'Enter',
        rows: [
          {
            label: 'Insert line break',
            shortcut: { mac: 'Shift+Enter', pc: 'Shift+Enter' },
          },
          {
            label: 'Insert section',
            shortcut: { mac: 'CommandOrControl+Enter', pc: 'CommandOrControl+Enter' },
          },
          {
            label: 'Insert sub section',
            shortcut: { mac: 'Shift+CommandOrControl+Enter', pc: 'Shift+CommandOrControl+Enter' },
          },
        ],
      },
      {
        title: 'Lists',
        rows: [
          {
            label: 'New list item',
            shortcut: { mac: 'Enter', pc: 'Enter' },
          },
          {
            label: 'Indent list item',
            shortcut: { mac: 'CommandOrControl+]', pc: 'CommandOrControl+]' },
          },
          {
            label: 'Outdent list item',
            shortcut: { mac: 'CommandOrControl+[', pc: 'CommandOrControl+[' },
          },
          {
            label: 'Ordered list',
            shortcut: { mac: 'CommandOrControl+Option+O', pc: 'CommandOrControl+Option+O' },
          },
          {
            label: 'Bullet list',
            shortcut: { mac: 'CommandOrControl+Option+K', pc: 'CommandOrControl+Option+K' },
          },
        ],
      },
    ],
  },
  {
    id: 'insert-elements',
    label: 'Insert elements',
    sections: [
      {
        title: 'Insert',
        rows: [
          {
            label: 'Insert figure',
            shortcut: {
              mac: 'CommandOrControl + Option + P',
              pc: 'CommandOrControl + Option + P',
            },
          },
          {
            label: 'Insert table',
            shortcut: {
              mac: 'CommandOrControl + Option + T',
              pc: 'CommandOrControl + Option + T',
            },
          },
          {
            label: 'Insert listing',
            shortcut: {
              mac: 'CommandOrControl + Option + L',
              pc: 'CommandOrControl + Option + L',
            },
          },
          {
            label: 'Insert equation block',
            shortcut: {
              mac: 'CommandOrControl + Option + E',
              pc: 'CommandOrControl + Option + E',
            },
          },
          {
            label: 'Insert box',
            shortcut: {
              mac: 'CommandOrControl + Option + B',
              pc: 'CommandOrControl + Option + B',
            },
          },
          {
            label: 'Insert link',
            shortcut: {
              mac: 'CommandOrControl + Option + H',
              pc: 'CommandOrControl + Option + H',
            },
          },
          {
            label: 'Insert footnote',
            shortcut: {
              mac: 'CommandOrControl + Option + F',
              pc: 'CommandOrControl + Option + F',
            },
          },
          {
            label: 'Insert citation',
            shortcut: {
              mac: 'CommandOrControl + Option + C',
              pc: 'CommandOrControl + Option + C',
            },
          },
          {
            label: 'Insert cross-reference',
            shortcut: {
              mac: 'CommandOrControl + Option + R',
              pc: 'CommandOrControl + Option + R',
            },
          },
          {
            label: 'Insert Inline equation',
            shortcut: {
              mac: 'Shift + CommandOrControl + Option + E',
              pc: 'Shift + CommandOrControl + E',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    sections: [
      {
        title: 'Navigation',
        rows: [
          {
            label: 'Next table cell / focus nearest element',
            shortcut: { mac: 'Tab', pc: 'Tab' },
          },
          {
            label: 'Previous table cell / focus nearest element back',
            shortcut: { mac: 'Escape', pc: 'Escape' },
          },
          {
            label: 'Exit editor to container',
            shortcut: { mac: 'Escape', pc: 'Escape' },
          },
          
        ],
      },
      {
        title: 'Others',
        rows: [
          {
            label: 'Move block up (joinUp) - join with sibling above it',
            shortcut: {
              mac: 'Option+ArrowUp',
              pc: 'Option+ArrowUp',
            },
          },
          {
            label: 'Move block down (joinDown) - join with sibling after it',
            shortcut: {
              mac: 'Option+ArrowDown',
              pc: 'Option+ArrowDown',
            },
          },
          {
            label: 'Lift block out of it\'s parent',
            shortcut: {
              mac: 'CommandOrControl+[ ',
              pc: 'CommandOrControl+Option+K',
            },
          },
          {
            label: 'Wrap in Blockquote',
            shortcut: {
              mac: 'CommandOrControl+>',
              pc: 'CommandOrControl+>',
            },
          },
        ],
      },
    ],
  },
]

export const formatShortcutForDisplay = (
  accelerator: string,
  platform: 'mac' | 'other'
): React.ReactNode => {
  const parts = accelerator.split('+').map((p) => p.trim())

  return (
    <>
      {parts.map((part, index) => {
        let content: React.ReactNode = part

        if (part === 'CommandOrControl') {
          content = platform === 'mac' ? '⌘' : 'Ctrl'
        } else if (part === 'Option') {
          content = platform === 'mac' ? '⌥' : 'Alt'
        } else if (part === 'Shift') {
          content = platform === 'mac' ? '⇧' : 'Shift'
        } else if (part === 'ArrowUp') {
          content = '↑'
        } else if (part === 'ArrowDown') {
          content = '↓'
        } else if (part === 'ArrowLeft') {
          content = '←'
        } else if (part === 'ArrowRight') {
          content = '→'
        } else if (part === 'BracketLeft') {
          content = '['
        } else if (part === 'BracketRight') {
          content = ']'
        } else if (part === 'Escape') {
          content = 'Esc'
        } else if (part === 'Tab') {
          content = 'Tab'
        } else if (part === 'Enter') {
          content = '↵'
        } else if (part === '/') {
          // 👇 important for Cmd + ?
          content = platform === 'mac' ? '?' : '/'
        }

        return (
          <React.Fragment key={index}>
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
