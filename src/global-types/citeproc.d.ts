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

declare module 'citeproc' {
  interface Citation {
    citationItems: Array<{ id: string }>
    properties?: {
      noteIndex?: number
    }
  }

  type VariableWrapper = (
    params: {
      context: string
      itemData: CSL.Data
      variableNames: [string]
    },
    prePunct: string,
    str: string,
    postPunct: string
  ) => string

  interface SystemOptions {
    retrieveLocale: (id: string) => string | Document | Locale
    retrieveItem: (id: string) => CSL.Data
    variableWrapper: VariableWrapper
  }

  interface BibliographyMetadata {
    bibliography_errors: string[]
  }

  type Bibliography = string[]

  export class Engine {
    constructor(
      sys: SystemOptions,
      style: string | Style,
      lang?: string,
      forceLang?: boolean
    )

    public rebuildProcessorState(
      citations: Citation[],
      mode?: string,
      uncitedItemIDs?: string[]
    ): Array<[string, number, string]> // id, noteIndex, output

    public makeBibliography(): [BibliographyMetadata, Bibliography]
  }

  export function getLocaleNames(
    style: string | Record<string, unknown>,
    preferredLocale: string
  ): string[]

  type Locale = Record<string, unknown>
  type Style = Record<string, unknown>

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
