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
  IconButton,
  IconTextButton,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import React, { useMemo, useReducer, useState } from 'react'
import styled from 'styled-components'

import { arrayReducer, attrsReducer } from '../../lib/array-reducer'
import { BibliographyItemAttrs } from '../../lib/references'
import { BibliographyItemSource } from './BibliographyItemSource'
import { CitedItem, CitedItems } from './CitationViewer'
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

const EditIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    color="#6E6E6E"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.7145 1.64621L12.4444 0.369929C11.9536 -0.12331 11.1566 -0.12331 10.6641 0.369929L9.44748 1.59248L12.2954 4.45434L13.7145 3.02831C14.0952 2.64572 14.0952 2.02877 13.7145 1.64621ZM8.70555 2.33642L11.5535 5.19826L4.3446 12.4424L1.4983 9.58059L8.70555 2.33642ZM0.399974 13.9906C0.166693 14.0476 -0.0439034 13.8375 0.00792508 13.6031L0.727197 10.3555L3.5735 13.2173L0.399974 13.9906Z"
      fill="#6E6E6E"
    />
  </svg>
)

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
    onSave(item)
    dispatchItems({
      type: 'update',
      items: [item],
    })
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

  const handleAdd = () => {
    setSearching(false)
    const item: BibliographyItemAttrs = {
      id: generateID(ObjectTypes.BibliographyItem),
      type: 'article-journal',
    }
    handleSave(item)
    handleCite([item])
    setEditingForm({ show: true, item: item })
  }

  const cited = useMemo(() => {
    return rids.flatMap((rid) => items.filter((i) => i.id === rid))
  }, [rids, items])

  if (searching) {
    return (
      <ReferenceSearch
        sources={sources}
        items={items}
        onAdd={handleAdd}
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
      <ReferencesModal
        isOpen={editingForm.show}
        onCancel={() => setEditingForm({ show: false })}
        items={items}
        citationCounts={citationCounts}
        item={editingForm.item}
        onSave={handleSave}
        onDelete={handleDelete}
      />
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
