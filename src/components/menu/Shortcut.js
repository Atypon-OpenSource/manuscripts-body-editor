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
import React from 'react';
import styled from 'styled-components';
import { isMac } from '../../lib/platform';
export const ShortcutContainer = styled.div `
  display: inline-flex;
  color: #777;
  margin-left: 16px;
  flex-shrink: 0;
  justify-content: flex-end;
`;
const modifiers = isMac
    ? {
        Option: '⌥',
        CommandOrControl: '⌘',
        Shift: '⇧',
    }
    : {
        Option: 'Alt',
        CommandOrControl: 'Ctrl',
        Shift: 'Shift',
    };
const system = isMac ? 'mac' : 'pc';
const separator = isMac ? '' : '-';
const Character = styled.span `
  display: inline-block;
  width: 1ch;
`;
const acceleratorParts = (accelerator) => {
    const parts = [];
    for (const part of accelerator[system].split('+')) {
        if (part in modifiers) {
            parts.push(modifiers[part]);
            parts.push(separator);
        }
        else {
            parts.push(React.createElement(Character, { key: part }, part));
        }
    }
    return parts;
};
export const Shortcut = ({ accelerator, }) => React.createElement(ShortcutContainer, null, acceleratorParts(accelerator));
