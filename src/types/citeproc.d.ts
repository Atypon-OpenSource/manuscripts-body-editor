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

// https://citeproc-js.readthedocs.io/en/latest/running.html#introduction
// https://github.com/citation-style-language/schema
// https://github.com/Zettlr/Zettlr/blob/dd2cbda72d9499edae6a1d95fb977794bde1ed4e/source/citeproc.d.ts

declare module 'citeproc' {
  interface Citation {
    citationItems: Array<{ id: string; prefix?: string; suffix?: string }>
    properties?: {
      mode?: string
      noteIndex?: number
      infix?: string
    }
  }

  interface SystemOptions {
    retrieveLocale: (id: string) => string | Document | Locale
    retrieveItem: (id: string) => CSL.Data
  }

  interface BibliographyMetadata {
    maxoffset: number
    entryspacing: number
    linespacing: number
    hangingindent: boolean
    ['second-field-align']: boolean
    bibstart: string
    bibend: string
    bibliography_errors: string[]
    entry_ids: string[]
  }

  type Bibliography = string[]

  export class Engine {
    constructor(
      sys: SystemOptions,
      style: string | Style,
      lang?: string,
      forceLang?: boolean
    )

    public updateItems(idList: Array<string | number>): void

    public updateUncitedItems(idList: Array<string | number>): void

    /**
     * Rebuilds the processor from scratch, based on a cached list of
     * citation objects. In a dynamic application, once the internal state of
     * processor is established, citations should edited with individual
     * invocations of ``processCitationCluster()``.
     *
     * Returns an array of ``[citationID,noteIndex,string]`` triples in
     * document order, where ``string`` is the fully disambiguated citation
     * cluster for the given document position.
     *
     * @param citations An array of citation input objects in document order. Each
     * citation object must be in the following form, with correct
     * values for ``citationID``, for each ``id``, and for ``noteIndex``.
     * Set ``noteIndex`` to ``0`` for in-text citations.
     * Default is to return an empty document update array.
     * ```json
     * {
     *   "citationID": "CITATION-1",
     *   "citationItems": [
     *     {
     *         "id": "ITEM-1"
     *     }
     *   ],
     *   "properties": {
     *     "noteIndex": 1
     *   }
     * }
     * ```
     * @param mode One of ``text``, ``html`` or ``rtf``. The default is ``html``.
     After invocation, the processor is returned to its previous output mode setting.
     * @param uncitedItemIDs An array of item IDs for uncited items to be included in
     the document bibliography, if any.
     */
    public rebuildProcessorState(
      citations: Citation[],
      mode?: 'text' | 'html' | 'rtf',
      uncitedItemIDs?: string[]
    ): Array<[string, number, string]> // id, noteIndex, output

    public makeBibliography(): [BibliographyMetadata, Bibliography]
  }

  export function getLocaleNames(
    style: string | Record<string, unknown>,
    preferredLocale: string
  ): string[]

  type Locale = Record<string, unknown>

  type Node = {
    name: string
    attrs: Record<string, unknown>
    children: Node[]
  }

  export class XmlJSON {
    constructor(dataObj: string | Record<string, unknown>)
    dataObj: Record<string, unknown>
    getNodesByName: (data: unknown, name: string) => Node[]
  }

  export function setupXml(style: string | Record<string, unknown>): XmlJSON
}
