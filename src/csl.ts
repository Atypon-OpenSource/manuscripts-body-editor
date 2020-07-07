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
  buildBibliographicDate,
  buildBibliographicName,
  CSL,
} from '@manuscripts/manuscript-transform'
import {
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
  Bundle,
} from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'

const roleFields: Array<keyof CSL.RoleFields> = [
  'author',
  'collection-editor',
  'composer',
  'container-author',
  'director',
  'editor',
  'editorial-director',
  'interviewer',
  'illustrator',
  'original-author',
  'recipient',
  'reviewed-author',
  'translator',
]

const dateFields: Array<keyof CSL.DateFields> = [
  'accessed',
  'container',
  'event-date',
  'issued',
  'original-date',
  'submitted',
]

const standardFields: Array<keyof CSL.StandardFields> = [
  'abstract',
  'annote',
  'archive',
  'archive-place',
  'archive_location',
  'authority',
  'call-number',
  'categories',
  'chapter-number',
  'citation-label',
  'citation-number',
  'collection-number',
  'collection-title',
  'container-title',
  'container-title-short',
  'dimensions',
  'DOI',
  'edition',
  'event',
  'event-place',
  'first-reference-note-number',
  'genre',
  'ISBN',
  'ISSN',
  'issue',
  'journalAbbreviation',
  'jurisdiction',
  'keyword',
  'language',
  'locator',
  'medium',
  'note',
  'number',
  'number-of-pages',
  'number-of-volumes',
  'original-publisher',
  'original-publisher-place',
  'original-title',
  'page',
  'page-first',
  'PMCID',
  'PMID',
  'publisher',
  'publisher-place',
  'references',
  'reviewed-title',
  'scale',
  'section',
  'shortTitle',
  'source',
  'status',
  'title',
  'title-short',
  'type',
  'URL',
  'version',
  'volume',
  'year-suffix',
]

const numberFields = [
  'chapter-number',
  'citation-number',
  'collection-number',
  'number',
  'number-of-pages',
  'number-of-volumes',
]

export const convertDataToBibliographyItem = (
  data: CSL.Item
): Partial<BibliographyItem> => {
  // const output: { [key in keyof BibliographyItem]: BibliographyItem[key] } = {}

  const output: { [key: string]: unknown } = {}

  for (const [key, item] of Object.entries(data)) {
    if (key === 'circa') {
      output[key] = Boolean(item)
    } else if (standardFields.includes(key as keyof CSL.StandardFields)) {
      output[key] = numberFields.includes(key) ? Number(item) : item
    } else if (roleFields.includes(key as keyof CSL.RoleFields)) {
      output[key] = (item as CSL.Name[]).map((value) =>
        buildBibliographicName(value)
      )
    } else if (dateFields.includes(key as keyof CSL.DateFields)) {
      output[key] = buildBibliographicDate(item as CSL.Date)
    }
  }

  return output
}

export const convertBibliographyItemToData = (
  bibliographyItem: BibliographyItem
): CSL.Item =>
  Object.entries(bibliographyItem).reduce(
    (output, [key, item]) => {
      if (standardFields.includes(key as keyof CSL.StandardFields)) {
        output[key] = item as string
      } else if (roleFields.includes(key as keyof CSL.RoleFields)) {
        output[key] = (item as BibliographicName[]).map((name) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, objectType, ...rest } = name
          return rest
        }) as CSL.Name[]
      } else if (dateFields.includes(key as keyof CSL.DateFields)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, objectType, ...rest } = item as BibliographicDate
        output[key] = rest as CSL.Date
      }

      return output
    },
    {
      id: bibliographyItem._id,
      type: bibliographyItem.type || 'article-journal',
    } as CSL.Item & { [key: string]: unknown }
  )

const createDoiUrl = (doi: string) =>
  'https://doi.org/' + encodeURIComponent(doi.replace(/^.*?(10\.)/, '$1'))

const createLink = (url: string, contents: string): Element => {
  const element = document.createElement('a')
  element.setAttribute('href', url)
  element.innerHTML = contents // IMPORTANT: this is HTML so must be sanitised later

  return element
}

const createSpan = (contents: string): Element => {
  const element = document.createElement('span')
  element.innerHTML = contents // IMPORTANT: this is HTML so must be sanitised later

  return element
}

export const wrapVariable = (
  field: string,
  itemData: CSL.Item,
  str: string
): Element => {
  switch (field) {
    case 'title': {
      if (itemData.DOI) {
        return createLink(createDoiUrl(itemData.DOI), str)
      }

      if (itemData.URL) {
        return createLink(itemData.URL, str)
      }

      return createSpan(str)
    }

    case 'URL':
      return createLink(str, str)

    case 'DOI':
      return createLink(createDoiUrl(str), str)

    default:
      return createSpan(str)
  }
}

const variableWrapper: CiteProc.VariableWrapper = (
  params,
  prePunct,
  str,
  postPunct
) => {
  if (params.context === 'bibliography') {
    const fields = params.variableNames.join(' ')

    const element = wrapVariable(fields, params.itemData, str)

    element.setAttribute('data-field', fields)

    return `${prePunct}${element.outerHTML}${postPunct}`
  }

  return `${prePunct}${str}${postPunct}`
}

interface Options {
  bundleID?: string
  bundle?: Bundle
  citationStyleData?: string
}

export const createProcessor = async (
  primaryLanguageCode: string,
  getLibraryItem: (id: string) => BibliographyItem | undefined,
  options: Options = {}
): Promise<CiteProc.Engine> => {
  const citationStyleData: string | CiteProc.Style | undefined =
    options.citationStyleData ||
    (await loadCitationStyleFromBundle(options.bundle)) ||
    (await loadCitationStyleFromBundleID(options.bundleID))

  if (!citationStyleData) {
    throw new Error('Missing citation style data')
  }

  const parentStyleData = await findParentStyle(citationStyleData)

  // TODO: merge metadata (locales) into parent from child?

  const locales = (await import(
    '@manuscripts/csl-locales/dist/locales.json'
  )) as Record<string, CiteProc.Locale>

  return new CiteProc.Engine(
    {
      retrieveItem: (id: string): CSL.Item => {
        const item = getLibraryItem(id)

        if (!item) {
          throw new Error(`Library item ${id} is missing`)
        }

        return convertBibliographyItemToData(item)
      },
      retrieveLocale: (id: string): CiteProc.Locale => locales[id],
      variableWrapper,
    },
    parentStyleData || citationStyleData,
    primaryLanguageCode,
    false
  )
}

const loadCitationStyleFromBundle = async (
  bundle?: Bundle
): Promise<CiteProc.Style | undefined> => {
  if (bundle && bundle.csl && bundle.csl.cslIdentifier) {
    return loadStyle(bundle.csl.cslIdentifier)
  }

  return undefined
}

const loadCitationStyleFromBundleID = async (
  bundleID?: string
): Promise<CiteProc.Style | undefined> => {
  const bundles: Bundle[] = await import(
    '@manuscripts/data/dist/shared/bundles.json'
  )

  const bundle = bundles.find((item) => item._id === bundleID)

  return loadCitationStyleFromBundle(bundle)
}

const findParentStyle = async (
  citationStyleData: string | CiteProc.Style
): Promise<CiteProc.Style | undefined> => {
  const parser = CiteProc.setupXml(citationStyleData)

  const links = parser.getNodesByName(parser.dataObj, 'link') as CiteProc.Node[]

  const parentLink = links.find(
    (link) => link.attrs.rel === 'independent-parent'
  )

  if (parentLink) {
    const href = parentLink.attrs.href as string | undefined

    if (href && href.startsWith('http://www.zotero.org/styles/')) {
      return loadStyle(href)
    }
  }
}

export const loadStyle = async (id: string): Promise<CiteProc.Style> => {
  const basename = id.split('/').pop()

  if (!basename) {
    throw new Error('No style name')
  }

  const styles = await import(
    `@manuscripts/csl-styles/dist/${basename[0]}.json`
  )

  return styles[id] as CiteProc.Style
}
