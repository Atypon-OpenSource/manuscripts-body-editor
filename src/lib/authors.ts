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

import {
  AffiliationNode,
  ContributorNode,
} from '@manuscripts/transform'

import { TrackableAttributes } from '../types'

export type AffiliationAttrs = TrackableAttributes<AffiliationNode>
export type ContributorAttrs = TrackableAttributes<ContributorNode>

export const affiliationLabel = (affiliation: AffiliationAttrs) => {
  const institution = affiliation.institution
  if (!institution) {
    return '(unknown institution)'
  }
  const department = affiliation.department
  return department ? `${institution} (${department})`.trim() : institution
}

export const affiliationName = (affiliation: AffiliationAttrs) => {
  return [
    affiliation.department,
    affiliation.institution,
    affiliation.addressLine1,
    affiliation.city,
    affiliation.county,
    affiliation.country,
    affiliation.postCode,
  ]
    .filter(Boolean)
    .join(', ')
}

export const authorLabel = (author: ContributorAttrs) => {
  const parts = [
    author.prefix,
    author.family ? initials(author) : author.given,
    author.family,
    author.suffix,
  ].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Unknown Author'
}

export const initials = (contributor: ContributorAttrs): string =>
    contributor.given
    ? contributor.given
        .trim()
        .split(' ')
        .map((part) => part.substring(0, 1).toUpperCase() + '.')
        .join('')
    : ''

export const authorComparator = (a: ContributorAttrs, b: ContributorAttrs) =>
  a.priority - b.priority
