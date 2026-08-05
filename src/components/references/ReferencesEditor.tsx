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
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useReducer, useState } from 'react'

import { attrsReducer } from '../../lib/array-reducer'
import { cleanItemValues } from '../../lib/utils'
import { ReferencesModal, ReferencesModalProps } from './ReferencesModal'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'
import { getBibliographyPluginState } from '../../plugins/bibliography'

export type ReferencesEditorProps = Omit<
  ReferencesModalProps,
  'isOpen' | 'onCancel'
>

const itemsReducer = attrsReducer<BibliographyItemAttrs>()

export const ReferencesEditor: React.FC<ReferencesEditorProps> = (props) => {
  const [isOpen, setOpen] = useState(true)
  const [items, dispatch] = useReducer(itemsReducer, props.items)

  const handleSave = (item: BibliographyItemAttrs) => {
    const cleanedItem = cleanItemValues(item)
    props.onSave(cleanedItem)
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

  return (
    <ReferencesModal
      {...props}
      isOpen={isOpen}
      onCancel={() => setOpen(false)}
      items={items}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  )
}

export const openReferencesEditor = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => {
  if (!view) {
    return
  }

  const props = getEditorProps(state)
  const onSave = () => {

  }
  const componentProps: ReferencesEditorProps = {
    items: [],
    citationCounts: new Map<string, number>(),
    // onSave: this.handleSave,
    // onDelete: this.handleDelete,
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
}
