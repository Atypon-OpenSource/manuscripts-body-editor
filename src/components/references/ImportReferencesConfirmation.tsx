/*!
 * © 2026 Atypon Systems LLC
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
import {
  CheckboxField,
  CheckboxLabel,
  FormActionsBar,
  ModalTitle,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ReferenceLine } from './ReferenceLine'

export interface ImportReferencesConfirmationProps {
  items: BibliographyItemAttrs[]
  onCancel: () => void
  onConfirm: (items: BibliographyItemAttrs[]) => void
}

export const ImportReferencesConfirmation: React.FC<
  ImportReferencesConfirmationProps
> = ({ items, onCancel, onConfirm }) => {
  const [selected, setSelected] = useState(() => items.map(() => true))

  const selectedCount = selected.filter(Boolean).length
  const countLabel = selectedCount === 1 ? 'reference' : 'references'

  const toggleItem = (index: number) => {
    setSelected((current) =>
      current.map((value, i) => (i === index ? !value : value))
    )
  }

  const handleConfirm = () => {
    onConfirm(items.filter((_, index) => selected[index]))
  }

  return (
    <>
      <Title>Import References</Title>
      <Subtitle>
        Importing {selectedCount} {countLabel}
      </Subtitle>
      <List>
        {items.map((item, index) => (
          <ListItem key={index}>
            <ItemCheckbox>
              <CheckboxField
                checked={selected[index]}
                aria-label={`Select reference ${index + 1}`}
                onChange={() => toggleItem(index)}
              />
              <div />
            </ItemCheckbox>
            <ReferenceLine item={item} />
          </ListItem>
        ))}
      </List>
      <FormActionsBar>
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={selectedCount === 0}
          onClick={handleConfirm}
        >
          Import {selectedCount} {countLabel}
        </PrimaryButton>
      </FormActionsBar>
    </>
  )
}

const Title = styled(ModalTitle)`
  border-bottom: 1px solid ${(props) => props.theme.colors.border.secondary};
  margin: 0 -${(props) => 6 * props.theme.grid.unit}px 20px;
  padding: 0 ${(props) => 6 * props.theme.grid.unit}px
    ${(props) => props.theme.grid.unit * 4}px;
`

const Subtitle = styled.p`
  color: ${(props) => props.theme.colors.text.secondary};
  font-weight: ${(props) => props.theme.font.weight.bold};
  margin: 0 0 16px;
  font-size: 14px;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${(props) => props.theme.grid.unit * 5}px;
  overflow-y: auto;
`

const ListItem = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.colors.border.secondary};
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.grid.unit * 3}px;
  padding: ${(props) => props.theme.grid.unit * 3}px 0;
`

const ItemCheckbox = styled(CheckboxLabel)`
  flex-shrink: 0;

  > div {
    margin: 0;

    &::before {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      margin: 0;
    }
  }
`
