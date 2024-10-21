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

import { SectionCategory } from '@manuscripts/json-schema'

export const uneditableSectionCategories: string[] = [
  'MPSectionCategory:bibliography',
  'MPSectionCategory:keywords',
  'MPSectionCategory:list-of-figures',
  'MPSectionCategory:list-of-tables',
  'MPSectionCategory:toc',
]

export const uniqueSectionCategories: string[] = [
  'MPSectionCategory:abstract-graphical',
  'MPSectionCategory:abstract',
]

export const isEditableSectionCategoryID = (id: string) =>
  !uneditableSectionCategories.includes(id)

export const isUnique = (categoryId: string) => {
  return uniqueSectionCategories.includes(categoryId)
}

export const isBackMatterSection = (groupId: string) => {
  return groupId === 'MPSectionCategory:backmatter'
}

export const isSubSection = (categoryId: string) => {
  return categoryId === 'MPSectionCategory:subsection'
}

export const getCategoryName = (categories: SectionCategory[], id: string) => {
  const category = categories.find((item) => item._id === id)
  return category ? category.name : ''
}
