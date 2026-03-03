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

import { EditAttrsTrackingIcon } from '@manuscripts/style-guide'
import { isDeleted } from '@manuscripts/track-changes-plugin'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function isHidden(node: ProsemirrorNode) {
  return isDeleted(node)
}

export const getAttrsTrackingButton = (changeID: string) => {
  const el = document.createElement('button')
  el.className = 'attrs-popper-button'
  el.value = changeID
  el.innerHTML = renderToStaticMarkup(createElement(EditAttrsTrackingIcon))

  return el
}
