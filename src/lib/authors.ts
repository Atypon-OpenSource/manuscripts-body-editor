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

import { BibliographicName } from '@manuscripts/json-schema'
import { AffiliationNode, ContributorNode } from '@manuscripts/transform'

export type AffiliationAttrs = Omit<
  AffiliationNode['attrs'],
  'addressLine2' | 'addressLine3' | 'email' | 'priority'
>

export type ContributorAttrs = Omit<
  ContributorNode['attrs'],
  'userID' | 'invitationID'
>

export const affiliationLabel = (affiliation: AffiliationAttrs) => {
  const institution = affiliation.institution
  if (!institution) {
    return '(unknown institution)'
  }
  const department = affiliation.department
  return department ? `${institution} (${department})`.trim() : institution
}

export const authorLabel = (author: ContributorAttrs) => {
  const name = author.bibliographicName
  return [initials(name), name.family, name.suffix].filter(Boolean).join(' ')
}

export const initials = (name: BibliographicName): string =>
  name.given
    ? name.given
        .trim()
        .split(' ')
        .map((part) => part.substring(0, 1).toUpperCase() + '.')
        .join('')
    : ''

export const authorComparator = (a: ContributorAttrs, b: ContributorAttrs) =>
  a.priority - b.priority
