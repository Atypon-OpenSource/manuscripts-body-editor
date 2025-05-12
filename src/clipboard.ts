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
import { getJatsListType, schema } from '@manuscripts/transform'
import { DOMParser } from 'prosemirror-model'

// we can override other node rules for clipboard here
// to avoid having a conflict with manuscripts-transform
const nodes = [
  {
    tag: 'p',
    node: 'paragraph',
  },
  {
    tag: 'ul, ol',
    node: 'list',
    getAttrs: (list: HTMLElement | string) => {
      const dom = list as HTMLElement
      return {
        listStyleType: getJatsListType(
          dom.style.listStyleType ||
            (dom.firstChild &&
              (dom.firstChild as HTMLElement).style.listStyleType)
        ),
      }
    },
  },
  // this is to avoid adding a new line, as it won't appear in google doc
  {
    tag: 'br.Apple-interchange-newline',
    ignore: true,
  },
]

export const clipboardParser = new DOMParser(schema, [
  ...nodes,
  ...DOMParser.fromSchema(schema).rules,
])
