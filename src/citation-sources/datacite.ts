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

import { Build, CSL, generateID } from '@manuscripts/manuscript-transform'
import {
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import axios from 'axios'
import { convertDataToBibliographyItem } from '../csl'

interface Creator {
  givenName: string
  familyName: string
  name: string
}

interface Date {
  dateType: string
  date: string
}

interface DataCiteItem {
  id: string
  attributes: {
    doi: string
    dates?: Date[]
    titles?: Array<{ title: string }>
    creators?: Creator[]
  }
}

const buildIssuedDate = (dates: Date[]): BibliographicDate | undefined => {
  const issued = dates.find(item => item.dateType === 'Issued')

  if (issued && issued.date) {
    return {
      _id: generateID(ObjectTypes.BibliographicDate),
      objectType: ObjectTypes.BibliographicDate,
      'date-parts': [issued.date.split('-')],
    }
  }
}

const chooseTitle = (titles: Array<{ title: string }>): string | undefined => {
  if (titles && titles.length) {
    return titles[0].title
  }
}

const buildAuthors = (creators: Creator[]): BibliographicName[] => {
  return creators.map(
    ({ givenName: given, familyName: family, name }): BibliographicName => ({
      _id: generateID(ObjectTypes.BibliographicName),
      objectType: ObjectTypes.BibliographicName,
      given,
      family,
    })
  )
}

const convertResult = (item: DataCiteItem): Build<BibliographyItem> => {
  const { creators, dates, doi, titles } = item.attributes

  return {
    _id: generateID(ObjectTypes.BibliographyItem),
    objectType: ObjectTypes.BibliographyItem,
    DOI: doi,
    title: chooseTitle(titles || []),
    type: 'dataset',
    issued: buildIssuedDate(dates || []),
    author: buildAuthors(creators || []),
  }
}

const search = async (
  query: string,
  rows: number
): Promise<{
  items: Array<Partial<BibliographyItem>>
  total: number
}> => {
  query = query.trim()

  // if the query is just a DOI, fetch that single record
  if (query.match(/^10\.\S+\/\S+$/)) {
    const data = await fetch({
      DOI: query,
    })

    return {
      items: [data],
      total: 1,
    }
  }

  const response = await axios.get<{
    data: DataCiteItem[]
    meta: {
      total: number
    }
  }>('https://api.datacite.org/dois', {
    params: {
      query,
      'page[size]': rows,
    },
  })

  if (response.status !== 200) {
    throw new Error('There was a problem searching for this query.')
  }

  const {
    data,
    meta: { total },
  } = response.data

  return {
    items: data.map(convertResult),
    total,
  }
}

const fetch = async (
  item: Partial<BibliographyItem>
): Promise<Partial<BibliographyItem>> => {
  if (!item.DOI) {
    throw new Error('The item does not have a DOI')
  }

  const response = await axios.get<CSL.Item>(
    'https://api.datacite.org/dois/' + encodeURIComponent(item.DOI),
    {
      headers: {
        Accept: 'application/vnd.citationstyles.csl+json',
      },
    }
  )

  if (response.status !== 200) {
    throw new Error('There was a problem fetching this item.')
  }

  return convertDataToBibliographyItem(response.data)
}

export const datacite = { fetch, search }
