/*!
 * © 2023 Atypon Systems LLC
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

import * as fuzzysort from 'fuzzysort'

import { BibliographyItemAttrs } from '../../lib/references'

export interface BibliographyItemSource {
  id: string
  label: string
  search: (
    query: string,
    limit: number
  ) => CancellablePromise<BibliographyItems>
}

export class CancellablePromise<T> extends Promise<T> {
  cancel?: () => void
  isCancelled?: boolean
}

export type BibliographyItems = {
  items: BibliographyItemAttrs[]
  total: number
}

export class DocumentReferenceSource implements BibliographyItemSource {
  public id = 'document'
  public label = 'Document'
  private items: BibliographyItemAttrs[]

  constructor(items: BibliographyItemAttrs[]) {
    this.items = items
  }

  search(query: string, limit: number): CancellablePromise<BibliographyItems> {
    if (!query) {
      return CancellablePromise.resolve({
        items: [...this.items].slice(0, limit),
        total: this.items.length,
      })
    }

    const index = [...this.items].map((i) => {
      return {
        item: i,
        title: i.title,
        authors: i.author?.map((a) => `${a.given} ${a.family}`).join(', '),
      }
    })

    const results = fuzzysort.go(query, index, {
      keys: ['title', 'authors'],
      limit: limit,
      threshold: -1000,
    })

    return CancellablePromise.resolve({
      items: results.map((r) => r.obj.item),
      total: results.total,
    })
  }
}
