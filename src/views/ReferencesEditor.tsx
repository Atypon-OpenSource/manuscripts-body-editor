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
import { ReferencesModal, ReferencesModalProps } from '@manuscripts/style-guide'
import React, { useState } from 'react'

//The purpose of this component is to make items stateful, so that
//the component refreshes on updates

export type ReferencesEditorProps = Omit<
  ReferencesModalProps,
  'isOpen' | 'onCancel'
>

export const ReferencesEditor: React.FC<ReferencesEditorProps> = (props) => {
  const [isOpen, setOpen] = useState(true)
  const [items, setItems] = useState(props.items)

  const handleSave = (item: BibliographyItem) => {
    props.onSave(item)
    setItems((s) => {
      const copy = [...s]
      const index = copy.findIndex((i) => i._id === item._id)
      if (index >= 0) {
        copy[index] = item
      } else {
        copy.push(item)
      }
      return copy
    })
  }

  const handleDelete = (item: BibliographyItem) => {
    props.onDelete(item)
    setItems((s) => s.filter((i) => i._id !== item._id))
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
