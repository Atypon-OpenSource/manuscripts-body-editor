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
import axios from 'axios'
import { basename } from 'path'

interface Locales {
  'language-names': { [key: string]: string[] }
}

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

  // tslint:disable-next-line:no-any
  const output: { [key: string]: any } = {}

  for (const [key, item] of Object.entries(data)) {
    if (key === 'circa') {
      output[key] = Boolean(item)
    } else if (standardFields.includes(key as keyof CSL.StandardFields)) {
      output[key] = numberFields.includes(key) ? Number(item) : item
    } else if (roleFields.includes(key as keyof CSL.RoleFields)) {
      output[key] = (item as CSL.Name[]).map(value =>
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
        output[key] = (item as BibliographicName[]).map(name => {
          const { _id, objectType, ...rest } = name
          return rest
        }) as CSL.Name[]
      } else if (dateFields.includes(key as keyof CSL.DateFields)) {
        const { _id, objectType, ...rest } = item as BibliographicDate
        output[key] = rest as CSL.Date
      }

      return output
    },
    {
      id: bibliographyItem._id,
      type: bibliographyItem.type || 'article-journal',
    } as CSL.Item & {[key: string]: any} // tslint:disable-line
  )

export class CitationManager {
  private readonly baseURL: string

  public constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  public createProcessor = async (
    bundleID: string,
    primaryLanguageCode: string,
    getLibraryItem: (id: string) => BibliographyItem | undefined,
    bundle?: Bundle,
    citationStyleData?: string
  ) => {
    if (!bundle) {
      bundle = await this.fetchBundle(bundleID)
    }

    if (!bundle) {
      throw new Error('Bundle not found')
    }

    if (!citationStyleData) {
      citationStyleData = await this.fetchCitationStyleString(bundle)
    }

    const citationLocales = await this.fetchCitationLocales(
      citationStyleData,
      primaryLanguageCode
    )

    const CiteProc = await import('citeproc')

    return new CiteProc.Engine(
      {
        retrieveItem: (id: string) => {
          const item = getLibraryItem(id)

          if (!item) {
            throw new Error('Library item not found')
          }

          return convertBibliographyItemToData(item)
        },
        retrieveLocale: (id: string) => citationLocales.get(id)!,
      },
      citationStyleData,
      primaryLanguageCode,
      false
    )
  }

  public fetchBundle = (bundleID: string): Promise<Bundle | undefined> =>
    this.fetchBundles().then(bundles =>
      bundles.find(item => item._id === bundleID)
    )

  public fetchBundles = async (): Promise<Bundle[]> =>
    import('@manuscripts/data/dist/shared/bundles.json').then(
      module => module.default as Bundle[]
    )

  public fetchLocales = (): Promise<Locales> =>
    this.fetchJSON('csl/locales/locales.json') as Promise<Locales>

  public async fetchCitationStyleString(bundle: Bundle): Promise<string> {
    if (!bundle.csl || !bundle.csl.cslIdentifier) {
      throw new Error('No CSL identifier')
    }

    const cslIdentifier = basename(bundle.csl.cslIdentifier, '.csl')
    const citationStyleDoc = await this.fetchCitationStyle(cslIdentifier)

    const serializer = new XMLSerializer()
    return serializer.serializeToString(citationStyleDoc)
  }

  private async fetchCitationStyle(id: string) {
    const doc = await this.fetchStyle(id)

    const parentURLNode = this.selectParentURL(doc)
    const parentURL = parentURLNode.stringValue

    if (!parentURL || !parentURL.startsWith('http://www.zotero.org/styles/')) {
      return doc
    }

    const parentDoc = await this.fetchStyle(basename(parentURL))

    if (!parentDoc) {
      return doc
    }

    const locales = this.selectLocaleNodes(doc)

    if (!locales.snapshotLength) {
      return parentDoc
    }

    // TODO: merge locales

    return parentDoc
  }

  private buildURL = (path: string) => this.baseURL + '/' + path

  private async fetchDocument(path: string) {
    const response = await axios.get<Document>(this.buildURL(path), {
      responseType: 'document',
    })

    return response.data
  }

  private async fetchText(path: string) {
    const response = await axios.get<string>(this.buildURL(path), {
      responseType: 'text',
    })

    return response.data
  }

  private async fetchJSON(path: string) {
    const response = await axios.get<object>(this.buildURL(path))

    return response.data
  }

  private fetchLocale(id: string) {
    // TODO: verify that the response is actually a CSL locale
    return this.fetchText(`csl/locales/locales-${id}.xml`)
  }

  private fetchStyle(id: string) {
    // TODO: verify that the response is actually a CSL style
    return this.fetchDocument(`csl/styles/${id}.csl`)
  }

  private async fetchCitationLocales(
    citationStyleData: string,
    primaryLanguageCode: string
  ) {
    const CiteProc = await import('citeproc')

    const locales: Map<string, string> = new Map()

    const localeNames = CiteProc.getLocaleNames(
      citationStyleData,
      primaryLanguageCode
    )

    await Promise.all(
      localeNames.map(async localeName => {
        const data = await this.fetchLocale(localeName)
        locales.set(localeName, data)
      })
    )

    return locales
  }

  private namespaceResolver(ns: string | null) {
    return ns === 'csl' ? 'http://purl.org/net/xbiblio/csl' : null
  }

  private selectParentURL(doc: Document) {
    return doc.evaluate(
      'string(/csl:style/csl:info/csl:link[@rel="independent-parent"]/@href)',
      doc,
      this.namespaceResolver,
      XPathResult.STRING_TYPE,
      null
    )
  }

  private selectLocaleNodes(doc: Document) {
    return doc.evaluate(
      '/csl:style/csl:locale',
      doc,
      this.namespaceResolver,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
  }
}
