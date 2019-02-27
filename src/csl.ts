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
} from '@manuscripts/manuscript-transform'
import {
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
  Bundle,
} from '@manuscripts/manuscripts-json-schema'
import axios from 'axios'
import CSL from 'citeproc'
import { basename } from 'path'

interface Locales {
  'language-names': { [key: string]: string[] }
}

const contributorFields = [
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

const dateFields = [
  'accessed',
  'container',
  'event-date',
  'issued',
  'original-date',
  'submitted',
]

const standardFields = [
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

export const convertDataToBibliographyItem = (
  data: CSL.Data
): Partial<BibliographyItem> =>
  Object.entries(data).reduce(
    (output, [key, item]) => {
      if (standardFields.includes(key)) {
        output[key] = item as string
      } else if (contributorFields.includes(key)) {
        output[key] = (item as CSL.Person[]).map(
          (value: Partial<BibliographicName>) => buildBibliographicName(value)
        ) as BibliographicName[]
      } else if (dateFields.includes(key)) {
        output[key] = buildBibliographicDate(
          item as CSL.StructuredDate
        ) as BibliographicDate
      }

      return output
    },
    {} as Partial<BibliographyItem & { [key: string]: any }> // tslint:disable-line
  )

export const convertBibliographyItemToData = (
  bibliographyItem: BibliographyItem
): CSL.Data =>
  Object.entries(bibliographyItem).reduce(
    (output, [key, item]) => {
      if (standardFields.includes(key as CSL.StandardFieldKey)) {
        output[key] = item as string
      } else if (contributorFields.includes(key as CSL.PersonFieldKey)) {
        output[key] = (item as BibliographicName[]).map(name => {
          const { _id, objectType, ...rest } = name
          return rest
        }) as CSL.Person[]
      } else if (dateFields.includes(key as CSL.DateFieldKey)) {
        const { _id, objectType, ...rest } = item as BibliographicDate
        output[key] = rest as CSL.StructuredDate
      }

      return output
    },
    {
      id: bibliographyItem._id,
      type: 'article-journal', // TODO: more types
    } as CSL.Data // tslint:disable-line
  )

export class CitationManager {
  private readonly baseURL: string

  public constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  public createProcessor = async (
    bundleID: string,
    primaryLanguageCode: string,
    getLibraryItem: (id: string) => BibliographyItem | undefined
  ) => {
    const bundle = await this.fetchBundle(bundleID)

    if (!bundle) {
      throw new Error('Bundle not found')
    }

    if (!bundle.csl || !bundle.csl.cslIdentifier) {
      throw new Error('No CSL identifier')
    }

    const cslIdentifier = basename(bundle.csl.cslIdentifier, '.csl')
    const citationStyleDoc = await this.fetchCitationStyle(cslIdentifier)

    const serializer = new XMLSerializer()
    const citationStyleData = serializer.serializeToString(citationStyleDoc)

    const citationLocales = await this.fetchCitationLocales(
      citationStyleData,
      primaryLanguageCode
    )

    return new CSL.Engine(
      {
        retrieveItem: (id: string) => {
          const item = getLibraryItem(id)

          if (!item) {
            throw new Error('Library item not found')
          }

          return convertBibliographyItemToData(item)
        },
        retrieveLocale: localeName => citationLocales.get(localeName)!,
        // embedBibliographyEntry: '',
        // wrapCitationEntry: '',
      },
      citationStyleData,
      primaryLanguageCode,
      false
    )
  }

  public fetchBundle = async (bundleID: string): Promise<Bundle> => {
    const bundles = await this.fetchBundles()

    const bundle = bundles.find(item => item._id === bundleID)

    if (!bundle) {
      throw new Error('Bundle not found: ' + bundleID)
    }

    return bundle
  }

  public fetchBundles = async (): Promise<Bundle[]> =>
    this.fetchJSON('shared/bundles.json') as Promise<Bundle[]>

  public fetchLocales = (): Promise<Locales> =>
    this.fetchJSON('csl/locales/locales.json') as Promise<Locales>

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
    return this.fetchText(`csl/locales/locales-${id}.xml`)
  }

  private fetchStyle(id: string) {
    return this.fetchDocument(`csl/styles/${id}.csl`)
  }

  private async fetchCitationLocales(
    citationStyleData: string,
    primaryLanguageCode: string
  ) {
    const locales: Map<string, string> = new Map()

    const localeNames = CSL.getLocaleNames(
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

  private namespaceResolver(ns: string) {
    return ns === 'csl' ? 'http://purl.org/net/xbiblio/csl' : null
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

  private selectParentURL(doc: Document) {
    return document.evaluate(
      'string(/csl:style/csl:info/csl:link[@rel="independent-parent"]/@href)',
      doc,
      this.namespaceResolver,
      XPathResult.STRING_TYPE,
      null
    )
  }

  private selectLocaleNodes(doc: Document) {
    return document.evaluate(
      '/csl:style/csl:locale',
      doc,
      this.namespaceResolver,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
  }
}
