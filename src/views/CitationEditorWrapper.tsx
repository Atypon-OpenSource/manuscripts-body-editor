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
import { BibliographyItem } from '@manuscripts/json-schema'
import {
  arrayReducer,
  CitationEditor,
  CitationEditorProps,
  modelsReducer,
} from '@manuscripts/style-guide'
import React, { useReducer } from 'react'

//The purpose of this component is to make items/rids stateful, so that
//the component refreshes on updates

const itemsReducer = modelsReducer<BibliographyItem>()
const ridsReducer = arrayReducer<string>()

export const CitationEditorWrapper: React.FC<CitationEditorProps> = (props) => {
  const [items, dispatchItems] = useReducer(itemsReducer, props.items)
  const [rids, dispatchRids] = useReducer(ridsReducer, props.rids)

  const handleSave = (item: BibliographyItem) => {
    props.onSave(item)
    dispatchItems({
      type: 'update',
      items: [item],
    })
  }
  const handleDelete = (item: BibliographyItem) => {
    props.onDelete(item)
    dispatchItems({
      type: 'delete',
      item,
    })
  }
  const handleCite = (items: BibliographyItem[]) => {
    props.onCite(items)
    dispatchRids({
      type: 'update',
      items: items.map((i) => i._id),
    })
  }
  const handleUncite = (rid: string) => {
    props.onUncite(rid)
    dispatchRids({
      type: 'delete',
      item: rid,
    })
  }

  return (
    <CitationEditor
      {...props}
      rids={rids}
      items={items}
      onCite={handleCite}
      onUncite={handleUncite}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  )
}
