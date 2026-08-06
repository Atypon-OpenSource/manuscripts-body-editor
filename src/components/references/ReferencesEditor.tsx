/*!
 * © 2024 Atypon Systems LLC
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
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import {
  BibliographyItemAttrs,
  generateNodeID,
  schema,
} from '@manuscripts/transform'
import React, { useEffect, useReducer, useState } from 'react'

import { attrsReducer } from '../../lib/array-reducer'
import { cleanItemValues } from '../../lib/utils'
import { deleteNode } from '../../lib/view'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'
import { ReferencesModal, ReferencesModalProps } from './ReferencesModal'

export type ReferencesEditorProps = Omit<
  ReferencesModalProps,
  'isOpen' | 'onCancel' | 'handleImport' | 'onSave'
> & {
  onSave: (item: BibliographyItemAttrs[]) => void
}

const itemsReducer = attrsReducer<BibliographyItemAttrs>()

export const ReferencesEditor: React.FC<ReferencesEditorProps> = (props) => {
  const [isOpen, setOpen] = useState(true)
  const [items, dispatch] = useReducer(itemsReducer, props.items)
  const [selectedItem, setSelectedItem] = useState(props.item)

  useEffect(() => {
    setSelectedItem(props.item)
  }, [props.item])

  const handleSave = (item: BibliographyItemAttrs) => {
    const cleanedItem = cleanItemValues(item)
    props.onSave([cleanedItem])
    dispatch({
      type: 'update',
      items: [cleanedItem],
    })
  }

  const handleDelete = (item: BibliographyItemAttrs) => {
    props.onDelete(item)
    dispatch({
      type: 'delete',
      item: item,
    })
  }

  const handleImport = (data: BibliographyItemAttrs[]) => {
    const newItems = data.map((item) =>
      cleanItemValues({
        ...item,
        id: generateNodeID(schema.nodes.bibliography_item),
      })
    )

    props.onSave(newItems)

    dispatch({
      type: 'set',
      state: [...items, ...newItems],
    })
  }

  return (
    <ReferencesModal
      isOpen={isOpen}
      onCancel={() => setOpen(false)}
      items={items}
      item={selectedItem}
      citationCounts={props.citationCounts}
      onSave={handleSave}
      onDelete={handleDelete}
      handleImport={handleImport}
    />
  )
}

export const openReferencesEditor = (
  state: EditorState,
  _?: (tr: Transaction) => void,
  view?: EditorView
) => {
  if (!view) {
    return false
  }

  const props = getEditorProps(state)
  const onSave = () => {
    //TODO:: will replace with the saveBibliographyItem from LEAN-5689
  }
  const componentProps: ReferencesEditorProps = {
    items: [],
    citationCounts: new Map<string, number>(),
    onDelete: (item) => deleteNode(view, item.id),
    onSave,
  }

  const referencesEditor = ReactSubView(
    props,
    ReferencesEditor,
    componentProps,
    state.doc,
    () => 0,
    view
  )
  view.focus()
  document.body.appendChild(referencesEditor)
  return true
}
