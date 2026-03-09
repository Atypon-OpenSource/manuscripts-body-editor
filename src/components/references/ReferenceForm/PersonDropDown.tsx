/*!
 * © 2025 Atypon Systems LLC
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
import { DeleteIcon, FormRow, Label, TextField } from '@manuscripts/style-guide'
import { Field } from 'formik'
import React, { useState } from 'react'

import {
  DropdownIndicator,
  PersonForm,
  RemoveButton,
  Section,
  Title,
  ToggleButton,
} from './styled-components'

export type PersonDropDownProps = {
  person: CSL.Person
  isNew: boolean
  index: number
  remove: (index: number) => void
  onChange: (e: React.ChangeEvent) => void
  type: 'author' | 'editor'
}

export const PersonDropDown = (props: PersonDropDownProps) => {
  const { person, isNew, index, remove, onChange, type } = props

  const [isOpen, setIsOpen] = useState(isNew)
  const fullName = [person.given, person.family].join(' ').trim()
  const title = fullName.length > 0 ? fullName : `Edit ${type} name`
  const prefix = `${type}.${index}`

  return (
    <Section>
      <Title>
        <ToggleButton
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
        >
          <DropdownIndicator />
          {title}
        </ToggleButton>
        <RemoveButton
          size={13}
          type="button"
          aria-label="Delete this editor"
          onClick={() => remove(index)}
        >
          <DeleteIcon />
        </RemoveButton>
      </Title>
      {isOpen && (
        <PersonForm>
          <FormRow>
            <Label htmlFor={`${prefix}.given`}>Given Name</Label>
            <Field
              name={`${prefix}.given`}
              id={`${prefix}.given`}
              value={person.given}
              onChange={onChange}
              component={TextField}
            />
          </FormRow>

          <FormRow>
            <Label htmlFor={`${prefix}.family`}>Family Name</Label>
            <Field
              name={`${prefix}.family`}
              id={`${prefix}.family`}
              value={person.family}
              onChange={onChange}
              component={TextField}
            />
          </FormRow>
        </PersonForm>
      )}
    </Section>
  )
}
