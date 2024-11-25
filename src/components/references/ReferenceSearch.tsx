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

import {
  AddNewIcon,
  ButtonGroup,
  IconTextButton,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import { debounce } from 'lodash'
import React, { useState } from 'react'
import styled from 'styled-components'

import { BibliographyItemAttrs } from '../../lib/references'
import {
  BibliographyItemSource,
  DocumentReferenceSource,
} from './BibliographyItemSource'
import { ReferenceSearchSection } from './ReferenceSearchSection'
import { SearchInput } from './SearchInput'

const ReferenceSearchSectionContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`

const Actions = styled(ButtonGroup)`
  align-items: center;
  box-shadow: 0 -2px 12px 0 rgba(216, 216, 216, 0.26);
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.grid.unit * 4}px;
`

const Container = styled.div`
  flex: 1;
  font-family: ${(props) => props.theme.font.family.sans};
`

const AddReferenceActions = styled(ButtonGroup)`
  button {
    margin-right: ${(props) => props.theme.grid.unit * 8}px;
  }

  button:hover,
  button:active {
    path {
      stroke: ${(props) => props.theme.colors.brand.medium};
    }
    rect {
      stroke: ${(props) => props.theme.colors.brand.medium};
    }
  }
`

export const ReferenceSearch: React.FC<{
  query?: string
  sources: BibliographyItemSource[]
  items: BibliographyItemAttrs[]
  onAdd: () => void
  onCite: (items: BibliographyItemAttrs[]) => void
  onCancel: () => void
}> = ({ query: initialQuery, sources, items, onAdd, onCite, onCancel }) => {
  const [query, setQuery] = useState<string>(initialQuery || '')
  const [selections, setSelections] = useState(
    new Map<string, BibliographyItemAttrs>()
  )

  const toggleSelection = (item: BibliographyItemAttrs) => {
    const id = item.id
    if (selections.has(id)) {
      selections.delete(id)
      setSelections(new Map([...selections]))
    } else {
      selections.set(id, item)
      setSelections(new Map([...selections]))
    }
  }

  const isSelected = (item: BibliographyItemAttrs) => {
    return selections.has(item.id)
  }

  const document = new DocumentReferenceSource(items)

  const handleClick = () => {
    const items = Array.from(selections.values())
    return onCite(items)
  }

  const debouncedSetQuery = debounce((e) => {
    setQuery(e.target.value.trim())
  }, 800)

  return (
    <Container className="reference-finder">
      <SearchInput onChange={debouncedSetQuery} defaultValue={initialQuery} />
      <ReferenceSearchSectionContainer>
        <ReferenceSearchSection
          key={document.id}
          query={query}
          source={document}
          isSelected={isSelected}
          onSelect={toggleSelection}
        />
        {query.length
          ? sources.map((source) => (
              <ReferenceSearchSection
                key={source.id}
                query={query}
                source={source}
                isSelected={isSelected}
                onSelect={toggleSelection}
              />
            ))
          : ''}
      </ReferenceSearchSectionContainer>
      <Actions>
        <AddReferenceActions>
          <IconTextButton onClick={onAdd}>
            <AddNewIcon />
            Add new
          </IconTextButton>
        </AddReferenceActions>
        <ButtonGroup>
          <SecondaryButton onClick={onCancel}>Close</SecondaryButton>
          <PrimaryButton onClick={handleClick} disabled={selections.size === 0}>
            Cite
          </PrimaryButton>
        </ButtonGroup>
      </Actions>
    </Container>
  )
}
