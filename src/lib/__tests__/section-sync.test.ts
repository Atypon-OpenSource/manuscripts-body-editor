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

import { ManuscriptNode, schema } from '@manuscripts/manuscript-transform'

import {
  childSectionCoordinates,
  Coordinates,
  diffReplacementBlocks,
} from '../section-sync'

/* tslint:disable:no-any */
describe('diffReplacementBlocks', () => {
  it('should compare the two sets of blocks and leave out those which can be kept in place', () => {
    const coords = [
      { id: 'one' },
      { id: 'two' },
      { id: 'three' },
      { id: 'five' },
    ]

    const nodes = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'four' } },
      { attrs: { id: 'five' } },
    ]

    const result = diffReplacementBlocks(
      coords as Coordinates,
      (nodes as unknown) as ManuscriptNode[]
    )
    expect(result).toHaveProperty('start', 2)
    expect(result).toHaveProperty('remove', 1)
    expect(result).toHaveProperty('insert', [{ attrs: { id: 'four' } }])
  })

  it('should replace all children for arrays that have nothing in common', () => {
    const coords = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes = [
      { attrs: { id: 'four' } },
      { attrs: { id: 'five' } },
      { attrs: { id: 'six' } },
    ]

    const result = diffReplacementBlocks(
      coords as Coordinates,
      (nodes as unknown) as ManuscriptNode[]
    )
    expect(result).toHaveProperty('start', 0)
    expect(result).toHaveProperty('remove', 3)
    expect(result.insert).toEqual(nodes)
  })

  it('should return a NOOP-type splice command if the arrays are equivalent', () => {
    const coords = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'three' } },
    ]

    const result = diffReplacementBlocks(
      coords as Coordinates,
      (nodes as unknown) as ManuscriptNode[]
    )
    expect(result.remove).toEqual(0)
    expect(result.insert).toHaveLength(0)
  })

  it('should return an insert-type splice command if nodes contains only new elements', () => {
    const coords = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'insert' } },
      { attrs: { id: 'three' } },
    ]

    const result = diffReplacementBlocks(
      coords as Coordinates,
      (nodes as unknown) as ManuscriptNode[]
    )
    expect(result).toHaveProperty('start', 2)
    expect(result).toHaveProperty('remove', 0)
    expect(result.insert).toHaveLength(1)
  })

  it('should return a delete-type splice command if nodes only removes elements', () => {
    const coords = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes = [{ attrs: { id: 'one' } }, { attrs: { id: 'three' } }]

    const result = diffReplacementBlocks(
      coords as Coordinates,
      (nodes as unknown) as ManuscriptNode[]
    )
    expect(result).toHaveProperty('start', 1)
    expect(result).toHaveProperty('remove', 1)
    expect(result.insert).toHaveLength(0)
  })
})

describe('childSectionCoordinates', () => {
  test('correctly identifies all types of section nodes', () => {
    const node = schema.nodes.manuscript.create({}, [
      schema.nodes.section.createAndFill({
        id: 'MPSection:1',
      })!,
      schema.nodes.toc_section.createAndFill({
        id: 'MPTOCSection:1',
      })!,
      schema.nodes.keywords_section.createAndFill({
        id: 'MPKeywordsSection:1',
      })!,
      schema.nodes.bibliography_section.createAndFill({
        id: 'MPBibliographySection:1',
      })!,
    ])

    const result = childSectionCoordinates(node)

    expect(result).toEqual([
      {
        end: 4,
        id: 'MPSection:1',
        start: 0,
      },
      {
        end: 9,
        id: 'MPTOCSection:1',
        start: 4,
      },
      {
        end: 14,
        id: 'MPKeywordsSection:1',
        start: 9,
      },
      {
        end: 19,
        id: 'MPBibliographySection:1',
        start: 14,
      },
    ])
  })
})
