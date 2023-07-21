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

import { BibliographyItem, Model } from '@manuscripts/json-schema'
import { CitationNodes, CitationProvider } from '@manuscripts/library'

export interface CiteProcCitation {
  citationItems: Array<{ id: string }>
  properties?: {
    noteIndex?: number
  }
}

export interface PluginState {
  citationNodes: CitationNodes
  citations: CiteProcCitation[]
}

export interface BibliographyProps {
  getCitationProvider: () => CitationProvider | undefined
  getLibraryItem: (id: string) => BibliographyItem | undefined
  getModel: <T extends Model>(id: string) => T | undefined
  modelMap?: Map<string, Model>
}
