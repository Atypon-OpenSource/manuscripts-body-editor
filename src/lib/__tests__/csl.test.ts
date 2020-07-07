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

// @ts-ignore
import { data } from '@manuscripts/examples/data/project-dump-2.json'
import { CSL, Decoder, findManuscript } from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  // Bundle,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'

import {
  convertBibliographyItemToData,
  convertDataToBibliographyItem,
  createProcessor,
  loadStyle,
} from '../../csl'
import {
  buildCitationNodes,
  buildCitations,
  GetLibraryItem,
  GetManuscript,
  GetModel,
} from '../../plugins/bibliography'

describe('CSL', () => {
  test('converts data from CSL to bibliography items', () => {
    const data: CSL.Item = {
      id: 'foo',
      type: 'article',
      DOI: 'foo',
      illustrator: [{ family: 'Derp' }],
      accessed: { literal: 'yesterday' },
    }
    const bibItem = convertDataToBibliographyItem(data)
    expect(bibItem.DOI).toMatch(data.DOI!)
    expect(bibItem.type).toMatch('article')
    expect(bibItem.illustrator![0].objectType).toMatch(
      ObjectTypes.BibliographicName
    )
  })

  test('converts bibliography items to CSL', () => {
    const item: BibliographyItem = {
      _id: 'MPBibliographyItem:x',
      objectType: 'MPBibliographyItem',
      DOI: 'foo',
      accessed: {
        _id: 'MPBibliographicDate:63937364-97E6-4722-AA96-0841EFBBAA0D',
        literal: 'yesterday',
        objectType: 'MPBibliographicDate',
      },
      illustrator: [
        {
          _id: 'MPBibliographicName:003024D5-CC4B-4C9B-95EA-C1D24255827E',
          family: 'Derp',
          objectType: 'MPBibliographicName',
        },
      ],
      type: 'article',
      containerID: 'ProjectX',
      sessionID: 'test',
      createdAt: 0,
      updatedAt: 0,
    }
    const data = convertBibliographyItemToData(item)

    expect(data).toEqual({
      DOI: 'foo',
      accessed: { literal: 'yesterday' },
      id: 'MPBibliographyItem:x',
      illustrator: [{ family: 'Derp' }],
      type: 'article',
    })

    const itemMissingType = { ...item }
    delete itemMissingType.type
    const dataWithDefaultType = convertBibliographyItemToData(itemMissingType)

    expect(dataWithDefaultType).toEqual({
      DOI: 'foo',
      accessed: { literal: 'yesterday' },
      id: 'MPBibliographyItem:x',
      illustrator: [{ family: 'Derp' }],
      type: 'article-journal',
    })
  })

  test('generates bibliography', async () => {
    const modelMap: Map<string, Model> = new Map()

    for (const item of data) {
      modelMap.set(item._id, (item as unknown) as Model)
    }

    const getModel: GetModel = <T extends Model>(id: string) =>
      modelMap.get(id) as T | undefined

    const getLibraryItem: GetLibraryItem = (id: string) =>
      modelMap.get(id) as BibliographyItem | undefined

    const manuscript = findManuscript(modelMap)
    const getManuscript: GetManuscript = () => manuscript

    const cslIdentifiers = [
      'http://www.zotero.org/styles/nature',
      'http://www.zotero.org/styles/science',
      'http://www.zotero.org/styles/plos',
      'http://www.zotero.org/styles/peerj',
      'http://www.zotero.org/styles/american-medical-association',
      'http://www.zotero.org/styles/3-biotech', // has independent-parent
    ]

    for (const cslIdentifier of cslIdentifiers) {
      // const bundle: Bundle = {
      //   _id: 'MPBundle:test',
      //   objectType: ObjectTypes.Bundle,
      //   createdAt: 0,
      //   updatedAt: 0,
      //   csl: { cslIdentifier },
      // }
      //
      // const citationProcessor = await createProcessor('en-GB', getLibraryItem, {
      //   bundle,
      // })

      const style = await loadStyle(cslIdentifier)
      const citationStyleData = JSON.stringify(style)

      const citationProcessor = await createProcessor('en-GB', getLibraryItem, {
        citationStyleData,
      })

      const decoder = new Decoder(modelMap)

      const article = decoder.createArticleNode()

      const citationNodes = buildCitationNodes(article, getModel)

      const citations = buildCitations(
        citationNodes,
        getLibraryItem,
        getManuscript
      )

      const generatedCitations = citationProcessor.rebuildProcessorState(
        citations
      )

      expect(generatedCitations).toMatchSnapshot(`citations-${cslIdentifier}`)

      for (const generatedCitation of generatedCitations) {
        const [, , content] = generatedCitation
        expect(content).not.toBe('[NO_PRINTED_FORM]')
      }

      const [
        bibmeta,
        generatedBibliographyItems,
      ] = citationProcessor.makeBibliography()

      expect(bibmeta.bibliography_errors).toHaveLength(0)

      expect(generatedBibliographyItems).toMatchSnapshot(
        `bibliography-items-${cslIdentifier}`
      )
    }
  })
})
