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

/**
 * Extra methods to polyfill parts of the DOM not covered by jest-prosemirror and jsdom.
 *
 * jest-prosemirror implements these polyfills by default
 * https://github.com/remirror/remirror/blob/8a6524a8da1a48b85fdde8f1c8b62375fbd5a318/packages/jest-remirror/src/jsdom-polyfills.ts
 */
export function polyfillDom() {
  window.scrollBy = jest.fn()

  // This could return a null but ProseMirror expects an object causing an error otherwise.
  // @ts-ignore
  document.getSelection = jest.fn(() => ({
    anchorNode: null,
    anchorOffset: 0,
    baseNode: null,
    baseOffset: 0,
    extentNode: null,
    extentOffset: 0,
    focusNode: null,
    focusOffset: 0,
    isCollapsed: true,
    rangeCount: 0,
    type: 'None',
  }))
}
