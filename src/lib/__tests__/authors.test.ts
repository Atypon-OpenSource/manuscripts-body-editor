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
  AffiliationAttrs,
  affiliationLabel,
  authorComparator,
  ContributorAttrs,
  initials,
} from '../authors'

describe('authorComparator', () => {
  it('should sort authors based on priority', () => {
    const contribs: ContributorAttrs[] = [
      {
        id: 'MPContributor:x',
        priority: 1,
        role: 'author',
        affiliationIDs: [],
        isCorresponding: false,
        isJointContributor: false,
        ORCID: '',
        email: '',
        correspIDs: [],
        footnoteIDs: [],
        prefix: '',
      },
      {
        id: 'MPContributor:y',
        priority: 0,
        role: 'author',
        affiliationIDs: [],
        isCorresponding: false,
        isJointContributor: false,
        ORCID: '',
        email: '',
        correspIDs: [],
        footnoteIDs: [],
        prefix: '',
      },
      {
        id: 'MPContributor:z',
        priority: 2,
        role: 'author',
        affiliationIDs: [],
        isCorresponding: false,
        isJointContributor: false,
        ORCID: '',
        email: '',
        correspIDs: [],
        footnoteIDs: [],
        prefix: '',
      },
    ]
    contribs.sort(authorComparator)
    expect(contribs.map((c) => c.id)).toEqual([
      'MPContributor:y',
      'MPContributor:x',
      'MPContributor:z',
    ])
  })
})

describe('initials', () => {
  it('initials exist when "given" is present with more than one given name', () => {
    const contributor = {
      given: 'Derek Gilbert',
      family: 'Dilbert',
    } as ContributorAttrs
    expect(initials(contributor)).toEqual('D.G.')
  })

  it('initials empty when no given name is present', () => {
    const contributor = {
      family: 'Dilbert',
    } as ContributorAttrs
    expect(initials(contributor)).toEqual('')
  })

  it('initials empty when given name is empty string', () => {
    const contributor = {
      family: 'Dilbert',
      given: '',
    } as ContributorAttrs
    expect(initials(contributor)).toEqual('')
  })

  it('ignore extra white space', () => {
    const contributor = {
      given: 'Derek ',
      family: 'Dilbert',
    } as ContributorAttrs
    expect(initials(contributor)).toEqual('D.')
  })
})

describe('affiliationLabel', () => {
  const affiliation: AffiliationAttrs = {
    id: 'MPAffiliation:aff-1',
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    city: '',
    country: 'United Kingdom',
    county: '',
    department: 'Dept of Examples',
    email: {
      href: '',
      text: '',
    },
    institution: 'University of Examples',
    postCode: '',
    priority: 0,
  }

  it('should return the institution name and department', () => {
    const result = affiliationLabel(affiliation)
    expect(result).toEqual('University of Examples (Dept of Examples)')
  })

  it('should exclude the department if it is not present', () => {
    const affiliation: AffiliationAttrs = {
      id: 'MPAffiliation:aff-1',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      country: 'United Kingdom',
      county: '',
      department: '',
      email: {
        href: '',
        text: '',
      },
      institution: 'University of Examples',
      postCode: '',
      priority: 0,
    }
    const result = affiliationLabel(affiliation)
    expect(result).toEqual('University of Examples')
  })

  it('should handle a missing institution', () => {
    const affiliation: AffiliationAttrs = {
      id: 'MPAffiliation:aff-1',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      country: 'United Kingdom',
      county: '',
      department: 'Dept of Examples',
      email: {
        href: '',
        text: '',
      },
      institution: '',
      postCode: '',
      priority: 0,
    }
    const result = affiliationLabel(affiliation)
    expect(result).toEqual('(unknown institution)')
  })

  it('should have a generic label if both institution and department are missing', () => {
    const affiliation: AffiliationAttrs = {
      id: 'MPAffiliation:aff-1',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      country: 'United Kingdom',
      county: '',
      department: '',
      email: {
        href: '',
        text: '',
      },
      institution: '',
      postCode: '',
      priority: 0,
    }
    const result = affiliationLabel(affiliation)
    expect(result).toEqual('(unknown institution)')
  })
})
