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
import { AddAuthorIcon, Theme } from '@manuscripts/style-guide'
import React, { useContext, useMemo, useState } from 'react'
import CreatableSelect from 'react-select/creatable'
import styled, { ThemeContext } from 'styled-components'

import {
  AffiliationAttrs,
  affiliationLabel,
  ContributorAttrs,
} from '../../lib/authors'
import { AffiliationButton } from './AffiliationButton'

const AddAffiliation = styled(AddAuthorIcon).attrs({ width: 24, height: 24 })`
  margin-right: 4px;

  circle,
  use {
    fill: ${(props) => props.theme.colors.brand.default};
  }

  path {
    mask: none;
  }
`

export const AddAffiliationIndicator: React.FC = () => <AddAffiliation />

const getSelectStyles = (focus: boolean, theme: Theme) => ({
  backgroundColor: focus
    ? theme.colors.background.fifth
    : theme.colors.background.primary,
  borderColor: focus
    ? theme.colors.border.field.active
    : theme.colors.border.field.default,
  '&:hover': {
    backgroundColor: theme.colors.background.fifth,
  },
  borderRadius: theme.grid.radius.default,
  boxShadow: 'none',
  fontFamily: theme.font.family.sans,
})

export interface AuthorAffiliationsProps {
  author: ContributorAttrs
  affiliations: AffiliationAttrs[]
  onSave: (affiliation: AffiliationAttrs) => void
  onAdd: (affiliation: AffiliationAttrs) => void
  onRemove: (affiliation: AffiliationAttrs) => void
}

export const AuthorAffiliations: React.FC<AuthorAffiliationsProps> = ({
  author,
  affiliations,
  onSave,
  onAdd,
  onRemove,
}) => {
  const theme = useContext(ThemeContext)
  // this is needed to empty the dropdown after an item is select
  const [searchText, setSearchText] = useState('')

  const affiliationMap = useMemo(
    () => new Map<string, AffiliationAttrs>(affiliations.map((a) => [a.id, a])),
    [affiliations]
  )

  const authorAffiliations = useMemo(() => {
    return author.affiliations?.map((i) =>
      affiliationMap.get(i)
    ) as AffiliationAttrs[]
  }, [affiliationMap, author])

  const otherAffiliations = useMemo(() => {
    const copy = new Map(affiliationMap)
    author.affiliations?.forEach((i) => copy.delete(i))
    return Array.from(copy.values())
  }, [affiliationMap, author])

  const options = otherAffiliations.map((a) => ({
    value: a.id,
    label: affiliationLabel(a),
  }))

  const handleChange = (id: string) => {
    const affiliation = affiliationMap.get(id)
    if (!affiliation) {
      return
    }
    onAdd(affiliation)
    setSearchText('')
  }

  const handleCreate = (institution: string) => {
    const affiliation: AffiliationAttrs = {
      id: generateID(ObjectTypes.Affiliation),
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      country: '',
      county: '',
      department: '',
      email: {
        href: '',
        text: '',
      },
      institution: institution,
      postCode: '',
      priority: 0,
    }
    onSave(affiliation)
    onAdd(affiliation)
  }

  return (
    <div data-cy="affiliations-editor">
      {authorAffiliations.map((a) => (
        <AffiliationButton
          key={`${author.id}-${a.id}`}
          affiliation={a}
          onSave={onSave}
          onRemove={() => onRemove(a)}
        />
      ))}
      <CreatableSelect
        options={options}
        isMulti={false}
        isClearable={true}
        value={null}
        inputValue={searchText}
        components={{
          IndicatorsContainer: AddAffiliationIndicator,
        }}
        placeholder="Begin typing to add affiliation"
        noOptionsMessage={() => 'Type the name of an institution'}
        onChange={(i) => i && handleChange(i.value)}
        onInputChange={setSearchText}
        onCreateOption={(v) => v && handleCreate(v)}
        isValidNewOption={(t) => !!t}
        styles={{
          control: (provided, state) => ({
            ...provided,
            ...getSelectStyles(state.isFocused, theme),
          }),
        }}
      />
    </div>
  )
}
