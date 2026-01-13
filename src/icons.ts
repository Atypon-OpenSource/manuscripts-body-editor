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
  AddAuthorIcon,
  AlertIcon,
  ArrowDownCircleIcon,
  ArrowUpIcon,
  DeleteIcon,
  DraggableIcon,
  EditIcon,
  FileCorruptedIcon,
  FileMainDocumentIcon,
  ImageDefaultIcon,
  ImageLeftIcon,
  ImageRightIcon,
  LinkIcon,
  LockIcon,
  PlusIcon,
  ScrollIcon,
  SectionCategoryIcon,
  TranslateIcon,
} from '@manuscripts/style-guide'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const renderIcon = (c: React.FC) => renderToStaticMarkup(createElement(c))

export const addAuthorIcon = renderIcon(AddAuthorIcon)
export const arrowDown = renderIcon(ArrowDownCircleIcon)
export const arrowUp = renderIcon(ArrowUpIcon)
export const alertIcon = renderIcon(AlertIcon)
export const deleteIcon = renderIcon(DeleteIcon)
export const editIcon = renderIcon(EditIcon)
export const sectionCategoryIcon = renderIcon(SectionCategoryIcon)
export const scrollIcon = renderIcon(ScrollIcon)
export const lockIcon = renderIcon(LockIcon)
export const plusIcon = renderIcon(PlusIcon)
export const imageRightIcon = renderIcon(ImageRightIcon)
export const imageLeftIcon = renderIcon(ImageLeftIcon)
export const imageDefaultIcon = renderIcon(ImageDefaultIcon)
export const fileCorruptedIcon = renderIcon(FileCorruptedIcon)
export const draggableIcon = renderIcon(DraggableIcon)
export const translateIcon = renderIcon(TranslateIcon)
export const linkIcon = renderIcon(LinkIcon)
export const fileMainDocumentIcon = renderIcon(FileMainDocumentIcon)
