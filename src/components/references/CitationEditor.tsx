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
import { generateID, ObjectTypes } from '@manuscripts/json-schema'
import {
  ButtonGroup,
  Category,
  DeleteSolidIcon,
  Dialog,
  EditIcon,
  IconButton,
  IconTextButton,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useMemo, useReducer, useState } from 'react'
import styled from 'styled-components'

import { arrayReducer, attrsReducer } from '../../lib/array-reducer'
import { cleanItemValues } from '../../lib/utils'
import { BibliographyItemSource } from './BibliographyItemSource'
import { CitedItem, CitedItems } from './CitationViewer'
import { ImportBibliographyModal } from './ImportBibliographyModal'
import { ReferenceLine } from './ReferenceLine'
import { ReferenceSearch } from './ReferenceSearch'
import { ReferencesModal } from './ReferencesModal'

const CitedItemActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: 12px;

  svg.remove-icon {
    color: #6e6e6e;
  }
`

const ActionButton = styled(IconButton).attrs({
  size: 24,
})`
  :disabled {
    background-color: transparent !important;
    border-color: transparent !important;
    color: rgb(255, 255, 255);
    path,
    g {
      fill: ${(props) => props.theme.colors.background.tertiary} !important;
    }
  }
  :not(:disabled):focus,
  :not(:disabled):hover {
    path,
    g {
      fill: ${(props) => props.theme.colors.brand.medium} !important;
    }
  }
`

const EditReferenceButton = styled(ActionButton)`
  margin-right: ${(props) => props.theme.grid.unit * 3}px;
`

const Actions = styled.div`
  margin: ${(props) => props.theme.grid.unit * 4}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export interface CitationEditorProps {
  query?: string
  rids: string[]
  items: BibliographyItemAttrs[]
  citationCounts: Map<string, number>
  sources: BibliographyItemSource[]
  onCite: (items: BibliographyItemAttrs[]) => void
  onUncite: (id: string) => void
  onSave: (item: BibliographyItemAttrs) => void
  onDelete: (item: BibliographyItemAttrs) => void
  onCancel: () => void
  canEdit: boolean
}

const itemsReducer = attrsReducer<BibliographyItemAttrs>()
const ridsReducer = arrayReducer<string>()

export const CitationEditor: React.FC<CitationEditorProps> = ({
  query,
  rids: $rids,
  items: $items,
  citationCounts,
  sources,
  onSave,
  onDelete,
  onCite,
  onUncite,
  onCancel,
  canEdit,
}) => {
  const [items, dispatchItems] = useReducer(itemsReducer, $items)
  const [rids, dispatchRids] = useReducer(ridsReducer, $rids)
  const handleSave = (item: BibliographyItemAttrs) => {
    const cleanedItem = cleanItemValues(item)
    onSave(cleanedItem)
    dispatchItems({
      type: 'update',
      items: [cleanedItem],
    })
    if (!rids.includes(item.id)) {
      handleCite([item])
    }
  }

  const handleDelete = (item: BibliographyItemAttrs) => {
    onDelete(item)
    dispatchItems({
      type: 'delete',
      item,
    })
  }
  const handleCite = (items: BibliographyItemAttrs[]) => {
    onCite(items)
    dispatchRids({
      type: 'update',
      items: items.map((i) => i.id),
    })
  }
  const handleUncite = (rid: string) => {
    onUncite(rid)
    dispatchRids({
      type: 'delete',
      item: rid,
    })
  }

  const [deleteDialog, setDeleteDialog] = useState<{
    show: boolean
    id?: string
  }>({ show: false })

  const [editingForm, setEditingForm] = useState<{
    show: boolean
    item?: BibliographyItemAttrs
  }>({
    show: false,
  })

  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleAdd = () => {
    setSearching(false)
    const item: BibliographyItemAttrs = {
      id: generateID(ObjectTypes.BibliographyItem),
      type: 'article-journal',
    }
    setEditingForm({ show: true, item: item })
  }

  const handleImport = () => {
    setSearching(false)
    setImporting(true)
  }
  const handleSaveImport = (data: BibliographyItemAttrs[]) => {
    data.forEach((item) => {
      const newItem = { ...item }
      newItem.id = generateID(ObjectTypes.BibliographyItem)
      handleSave(newItem)
      handleCite([newItem])
    })
  }

  const cited = useMemo(() => {
    return rids.flatMap((rid) => items.filter((i) => i.id === rid))
  }, [rids, items])

  if (editingForm.show) {
    return (
      <ReferencesModal
        isOpen={editingForm.show}
        onCancel={() => setEditingForm({ show: false })}
        items={items}
        citationCounts={citationCounts}
        item={editingForm.item}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  if (importing) {
    return (
      <ImportBibliographyModal
        onCancel={() => setImporting(false)}
        onSave={handleSaveImport}
      />
    )
  }
  if (searching) {
    return (
      <ReferenceSearch
        sources={sources}
        items={items}
        onAdd={handleAdd}
        onImport={handleImport}
        onCite={(items) => {
          setSearching(false)
          handleCite(items)
        }}
        onCancel={() => setSearching(false)}
      />
    )
  }
  if (!rids.length) {
    return (
      <ReferenceSearch
        query={query}
        sources={sources}
        items={items}
        onAdd={handleAdd}
        onImport={handleImport}
        onCite={handleCite}
        onCancel={onCancel}
      />
    )
  }
  return (
    <>
      <Dialog
        isOpen={deleteDialog.show}
        category={Category.confirmation}
        header="Remove cited item"
        message="Are you sure you want to remove this cited item? It will still exist in the reference list."
        actions={{
          secondary: {
            action: () => {
              if (deleteDialog.id) {
                handleUncite(deleteDialog.id)
                setDeleteDialog({ show: false })
              }
            },
            title: 'Remove',
          },
          primary: {
            action: () => setDeleteDialog({ show: false }),
            title: 'Cancel',
          },
        }}
      />
      <CitedItems>
        {cited.map((item) => (
          <CitedItem key={item.id}>
            <ReferenceLine item={item} />
            <CitedItemActions>
              <EditReferenceButton
                value={item.id}
                disabled={!canEdit}
                onClick={() => setEditingForm({ show: true, item: item })}
              >
                <EditIcon />
              </EditReferenceButton>
              <ActionButton
                disabled={!canEdit}
                onClick={() => setDeleteDialog({ show: true, id: item.id })}
              >
                <DeleteSolidIcon className={'remove-icon'} />
              </ActionButton>
            </CitedItemActions>
          </CitedItem>
        ))}
      </CitedItems>
      <Actions>
        <IconTextButton />
        <ButtonGroup>
          <SecondaryButton onClick={onCancel}>Done</SecondaryButton>
          <PrimaryButton disabled={!canEdit} onClick={() => setSearching(true)}>
            Add Citation
          </PrimaryButton>
        </ButtonGroup>
      </Actions>
    </>
  )
}
