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
import ArrowDownBlue from '@manuscripts/assets/react/ArrowDownBlue'
import { DeleteIcon } from '@manuscripts/style-guide'
import { isEqual } from 'lodash'
import React, { useState } from 'react'
import styled from 'styled-components'

import { AffiliationAttrs, affiliationLabel } from '../../lib/authors'
import { AffiliationForm } from './AffiliationForm'

const Container = styled.div`
  border: 1px solid ${(props) => props.theme.colors.border.field.default};
  border-radius: ${(props) => props.theme.grid.radius.default};
  background: ${(props) => props.theme.colors.background.primary};
  margin-bottom: 2px;
  overflow: hidden;
`

const AffiliationFormContainer = styled.div`
  border: 1px solid ${(props) => props.theme.colors.border.field.default};
  border-radius: ${(props) => props.theme.grid.radius.default};
  margin: 6px 12px 12px;
  overflow: hidden;
`

const AffiliationLabel = styled.div`
  margin: 0;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  padding-right: 0.5rem;
`

const DropdownIndicator = styled(ArrowDownBlue)`
  border: 0;
  border-radius: 50%;
  margin-right: 0.6em;
  min-width: 20px;
`

const ToggleButton = styled.button`
  flex-grow: 1;
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: 1rem;
  padding: 0.6em 0.5em;
  outline: none;

  &.open svg {
    transform: rotateX(180deg);
  }
`

const RemoveButton = styled.div`
  cursor: pointer;
`

export interface AffiliationButtonProps {
  affiliation: AffiliationAttrs
  onSave: (affiliation: AffiliationAttrs) => void
  onRemove: () => void
}

export const AffiliationButton: React.FC<AffiliationButtonProps> = ({
  affiliation,
  onSave,
  onRemove,
}) => {
  const [isOpen, setOpen] = useState(false)
  const toggleOpen = () => {
    setOpen((o) => !o)
  }

  const handleSave = (values: AffiliationAttrs) => {
    if (isEqual(values, affiliation)) {
      return
    }
    const copy = {
      ...affiliation,
      ...values,
    }
    onSave(copy)
  }

  return (
    <Container>
      <AffiliationLabel>
        <ToggleButton
          type="button"
          className={isOpen ? 'open' : ''}
          onClick={toggleOpen}
        >
          <DropdownIndicator />
          {affiliationLabel(affiliation)}
        </ToggleButton>
        <RemoveButton onClick={onRemove}>
          <DeleteIcon />
        </RemoveButton>
      </AffiliationLabel>
      {isOpen && (
        <AffiliationFormContainer>
          <AffiliationForm values={affiliation} onSave={handleSave} />
        </AffiliationFormContainer>
      )}
    </Container>
  )
}
