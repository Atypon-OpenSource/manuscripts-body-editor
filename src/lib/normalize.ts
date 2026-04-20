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

import { generateNodeID, Nodes, schema } from '@manuscripts/transform'

import { AffiliationAttrs, ContributorAttrs } from './authors'

const trim = (value: string | undefined) => (value ?? '').trim()

export const normalizeAffiliation = (
  a: AffiliationAttrs
): AffiliationAttrs => ({
  ...a,
  institution: trim(a.institution),
  department: trim(a.department),
  addressLine1: trim(a.addressLine1),
  addressLine2: trim(a.addressLine2),
  addressLine3: trim(a.addressLine3),
  postCode: trim(a.postCode),
  country: trim(a.country),
  county: trim(a.county),
  city: trim(a.city),
  email: a.email ?? { href: '', text: '' },
})

export const normalizeAuthor = (author: ContributorAttrs) => {
  const basic: ContributorAttrs = {
    id: author.id,
    role: trim(author.role),
    affiliationIDs: (author.affiliationIDs || []).sort(),
    given: trim(author.given),
    family: trim(author.family),
    email: trim(author.email),
    isCorresponding: author.isCorresponding || false,
    ORCID: trim(author.ORCID),
    priority: author.priority,
    isJointContributor: author.isJointContributor || false,
    degrees: author.degrees || [],
    footnoteIDs: author.footnoteIDs || [],
    correspIDs: author.correspIDs || [],
    prefix: trim(author.prefix),
    suffix: trim(author.suffix),
    degrees: trim(author.degrees),
    creditRoles: Array.isArray(author.creditRoles) ? author.creditRoles : [],
  }

  return basic
}

type WithID = { id: string | undefined }

export const checkID = <T extends WithID>(attrs: T, nodeType: Nodes) => {
  return {
    ...attrs,
    id: attrs.id || generateNodeID(schema.nodes[nodeType]),
  }
}
