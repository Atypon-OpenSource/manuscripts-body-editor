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
import {
  AlertIcon,
  ArrowDownCircleIcon,
  DeleteIcon,
  EditIcon,
  PlusIcon,
  ScrollIcon,
  SectionCategoryIcon,
} from '@manuscripts/style-guide'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const renderIcon = (c: React.FC) => renderToStaticMarkup(createElement(c))

export const arrowDown = renderIcon(ArrowDownCircleIcon)
export const alertIcon = renderIcon(AlertIcon)
export const deleteIcon = renderIcon(DeleteIcon)
export const editIcon = renderToStaticMarkup(createElement(EditIcon))
export const sectionCategoryIcon = renderIcon(SectionCategoryIcon)
export const scrollIcon = renderToStaticMarkup(createElement(ScrollIcon))
export const plusIcon = renderIcon(PlusIcon)
