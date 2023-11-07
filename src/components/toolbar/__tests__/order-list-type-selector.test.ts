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
import { schema } from '@manuscripts/transform'
import { createEditor } from 'jest-prosemirror'
import { DOMParser, NodeType } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'

import { updateListStyle } from '../OrderListSelector'

const createList = (list: string[], type: NodeType) =>
  type.create({}, [
    ...list.map((item) =>
      schema.nodes.list_item.create(
        {},
        schema.nodes.paragraph.create({}, [schema.text(item)])
      )
    ),
  ])

const createNestedList = (list: string[], type: NodeType) =>
  type.create({}, [
    ...list.map((item) =>
      schema.nodes.list_item.create({}, [
        schema.nodes.paragraph.create({}, [schema.text(item)]),
        type.create({}, [
          ...list.map((item) =>
            schema.nodes.list_item.create({}, [
              schema.nodes.paragraph.create({}, [schema.text(item)]),
            ])
          ),
        ]),
      ])
    ),
  ])

describe('test order list style type selector', () => {
  test('change first level style to roman-lower', async () => {
    const editor = createEditor(
      schema.nodes.section.create(
        {},
        createList(['1', '2', '3'], schema.nodes.ordered_list)
      ),
      {
        domParser: DOMParser.fromSchema(schema),
      }
    )

    editor.command((state, dispatch) => {
      if (dispatch) {
        dispatch(
          state.tr.setSelection(TextSelection.near(state.doc.resolve(13)))
        )
      }
      return true
    })

    editor
      .command((state, dispatch) => {
        const range = state.selection.$from.blockRange(state.selection.$to)
        if (dispatch && range) {
          updateListStyle(state, dispatch, range, 'roman-lower')
        }
        return true
      })
      .callback((content) => {
        expect(content.doc.lastChild).toHaveProperty(
          'attrs.listStyleType',
          'roman-lower'
        )
      })
  })

  test('change second level for nested list to alpha-lower', async () => {
    const editor = createEditor(
      schema.nodes.section.create({}, [
        schema.nodes.section_title.create({}),
        createNestedList(['1', '2', '3'], schema.nodes.ordered_list),
      ]),
      {
        domParser: DOMParser.fromSchema(schema),
      }
    )

    editor.command((state, dispatch) => {
      if (dispatch) {
        dispatch(
          state.tr.setSelection(TextSelection.near(state.doc.resolve(15)))
        )
      }
      return true
    })

    editor
      .command((state, dispatch) => {
        const range = state.selection.$from.blockRange(state.selection.$to)
        if (dispatch && range) {
          updateListStyle(state, dispatch, range, 'alpha-lower')
        }
        return true
      })
      .callback((content) => {
        const parentList = content.doc.lastChild
        const list1 = parentList?.child(0).child(1)
        const list2 = parentList?.child(1).child(1)
        const list3 = parentList?.child(2).child(1)

        expect(list1).toHaveProperty('attrs.listStyleType', 'alpha-lower')
        expect(list2).toHaveProperty('attrs.listStyleType', 'alpha-lower')
        expect(list3).toHaveProperty('attrs.listStyleType', 'alpha-lower')
      })
  })
})
