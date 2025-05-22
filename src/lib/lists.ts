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
import { ListStyleType } from '@manuscripts/transform'

export const parseCssListStyleType = (style: string | null) => {
  switch (style) {
    case 'disc':
      return 'bullet'
    case 'decimal':
      return 'order'
    case 'lower-alpha':
      return 'alpha-lower'
    case 'upper-alpha':
      return 'alpha-upper'
    case 'lower-roman':
      return 'roman-lower'
    case 'upper-roman':
      return 'roman-upper'
    case 'simple':
      return 'none'
    default:
      return 'none'
  }
}

export const writeCssListStyleType = (type: ListStyleType) => {
  switch (type) {
    case 'bullet':
      return 'disc'
    case 'order':
      return 'decimal'
    case 'alpha-lower':
      return 'lower-alpha'
    case 'alpha-upper':
      return 'upper-alpha'
    case 'roman-lower':
      return 'lower-roman'
    case 'roman-upper':
      return 'upper-roman'
    case 'simple':
      return 'none'
  }
}
