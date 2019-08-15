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

import { diffReplacementBlocks } from '../section-sync'

/* tslint:disable:no-any */
describe('diffReplacementBlocks', () => {
  it('should compare the two sets of blocks and leave out those which can be kept in place', () => {
    const coords: any = [
      { id: 'one' },
      { id: 'two' },
      { id: 'three' },
      { id: 'five' },
    ]

    const nodes: any = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'four' } },
      { attrs: { id: 'five' } },
    ]

    const result = diffReplacementBlocks(coords, nodes)
    expect(result).toHaveProperty('start', 2)
    expect(result).toHaveProperty('remove', 1)
    expect(result).toHaveProperty('insert', [{ attrs: { id: 'four' } }])
  })

  it('should replace all children for arrays that have nothing in common', () => {
    const coords: any = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes: any = [
      { attrs: { id: 'four' } },
      { attrs: { id: 'five' } },
      { attrs: { id: 'six' } },
    ]

    const result = diffReplacementBlocks(coords, nodes)
    expect(result).toHaveProperty('start', 0)
    expect(result).toHaveProperty('remove', 3)
    expect(result.insert).toEqual(nodes)
  })

  it('should return a NOOP-type splice command if the arrays are equivalent', () => {
    const coords: any = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes: any = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'three' } },
    ]

    const result = diffReplacementBlocks(coords, nodes)
    expect(result.remove).toEqual(0)
    expect(result.insert).toHaveLength(0)
  })

  it('should return an insert-type splice command if nodes contains only new elements', () => {
    const coords: any = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes: any = [
      { attrs: { id: 'one' } },
      { attrs: { id: 'two' } },
      { attrs: { id: 'insert' } },
      { attrs: { id: 'three' } },
    ]

    const result = diffReplacementBlocks(coords, nodes)
    expect(result).toHaveProperty('start', 2)
    expect(result).toHaveProperty('remove', 0)
    expect(result.insert).toHaveLength(1)
  })

  it('should return a delete-type splice command if nodes only removes elements', () => {
    const coords: any = [{ id: 'one' }, { id: 'two' }, { id: 'three' }]

    const nodes: any = [{ attrs: { id: 'one' } }, { attrs: { id: 'three' } }]

    const result = diffReplacementBlocks(coords, nodes)
    expect(result).toHaveProperty('start', 1)
    expect(result).toHaveProperty('remove', 1)
    expect(result.insert).toHaveLength(0)
  })
})
