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

import { ManuscriptNodeType } from '@manuscripts/transform'

import { insertInlineFootnote } from '../../commands'
import { parseDoc, setupEditor } from '../../testing/setup-editor'
import deletedFootnoteJson from './__fixtures__/deleted-footnote.json'
import insertedFootnoteJson from './__fixtures__/inserted-footnote.json'

jest.mock('@manuscripts/transform', () => {
  const mockTransformOriginal = jest.requireActual('@manuscripts/transform')
  return {
    ...mockTransformOriginal,
    // Ids are generated by the persist plugin in an appendTransaction
    generateNodeID: (type: ManuscriptNodeType) => {
      return `${type.name}_id`
    },
  }
})

describe('footnotes plugin', () => {
  test("should create an inline node and footnotes section if it doesn't exist", () => {
    const expectedDoc = parseDoc(insertedFootnoteJson.doc)

    const { view } = setupEditor()
      .selectText(10)
      .command(insertInlineFootnote)
      .insertText('a footnote')
      .callback((content) => {
        expect(content.state.tr.doc.toJSON()).toEqual(expectedDoc.toJSON())
        expect(content.state.tr.selection.toJSON()).toEqual(
          insertedFootnoteJson.selection
        )
      })
    view.destroy()
  })
  test('should remove the inline node as well as the footnote on deletion', () => {
    const expectedDoc = parseDoc(deletedFootnoteJson.doc)
    const { view } = setupEditor()
      .selectText(10)
      .command(insertInlineFootnote)
      .insertText('a footnote')
      .selectText(11)
      .backspace()
      .callback((content) => {
        expect(content.state.tr.doc.toJSON()).toEqual(expectedDoc.toJSON())
        expect(content.state.tr.selection.toJSON()).toEqual(
          deletedFootnoteJson.selection
        )
      })
    view.destroy()
  })
})
