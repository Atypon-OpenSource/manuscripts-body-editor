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

import { SectionCategory } from '@manuscripts/transform'

export const isEditableSection = (
  id: string,
  sectionCategories: Map<string, SectionCategory>
) => {
  const category = sectionCategories.get(id)
  if (!category) {
    return false
  }
  return category.isEditable
}
export const isAbstractSection = (
  id: string,
  sectionCategories: Map<string, SectionCategory>
) => {
  const category = sectionCategories.get(id)
  return (
    category?._id === 'MPSectionCategory:abstract' ||
    category?._id === 'MPSectionCategory:abstract-graphical'
  )
}

export const isBackMatterSection = (groupId: string) => {
  return groupId === 'MPSectionCategory:backmatter'
}

export const isSubSection = (categoryId: string) => {
  return categoryId === 'MPSectionCategory:subsection'
}

export const getCategoryName = (
  categories: Map<string, SectionCategory>,
  id: string
) => {
  const category = categories.get(id)
  return category ? category.name : ''
}
