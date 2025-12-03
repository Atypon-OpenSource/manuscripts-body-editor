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

import { ContributorAttrs } from './authors'

export const normalizeAuthor = (author: ContributorAttrs) => {
  const basic: ContributorAttrs = {
    id: author.id,
    role: author.role || '',
    affiliations: (author.affiliations || []).sort(),
    bibliographicName: author.bibliographicName,
    email: author.email || '',
    isCorresponding: author.isCorresponding || false,
    ORCIDIdentifier: author.ORCIDIdentifier || '',
    priority: author.priority,
    isJointContributor: author.isJointContributor || false,
    userID: author.userID || '',
    invitationID: author.invitationID || '',
    footnote: author.footnote || [],
    corresp: author.corresp || [],
    prefix: author.prefix || '',
  }

  if (author.creditRoles && Array.isArray(author.creditRoles)) {
    basic.creditRoles = author.creditRoles
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
