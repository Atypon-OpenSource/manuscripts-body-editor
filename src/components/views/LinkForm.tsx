/*!
 * © 2019 Atypon Systems LLC
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
  Button,
  MiniButton,
  PrimarySubmitButton,
  TextField,
} from '@manuscripts/style-guide'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

export interface LinkValue {
  text: string
  href: string
}

export const LinkForm: React.FC<{
  handleCancel: (event: React.MouseEvent<HTMLButtonElement>) => void
  handleRemove: (event: React.MouseEvent<HTMLButtonElement>) => void
  handleSave: (value: LinkValue) => void
  value: LinkValue
}> = ({ handleCancel, handleRemove, handleSave, value }) => {
  const [href, setHref] = useState(value.href)
  const [text, setText] = useState(value.text)

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      handleSave({ href, text })
    },
    [href, text]
  )

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <FieldHeading>
          <Label>URL</Label>

          {href && <Open href={href} target={'_blank'} />}
        </FieldHeading>

        <TextField
          type={'url'}
          name={'href'}
          value={href}
          autoComplete={'off'}
          autoFocus={true}
          required={true}
          pattern={'https?://.+'}
          onChange={event => {
            setHref(event.target.value)
          }}
        />
      </Field>

      <Field>
        <FieldHeading>
          <Label>Text</Label>
        </FieldHeading>

        <TextField
          type={'text'}
          name={'text'}
          value={text}
          autoComplete={'off'}
          required={true}
          onChange={event => {
            setText(event.target.value)
          }}
        />
      </Field>

      <Actions>
        <ActionGroup>
          <MiniButton onClick={handleRemove}>Remove Link</MiniButton>
        </ActionGroup>

        <ActionGroup>
          <Button onClick={handleCancel}>Cancel</Button>
          <PrimarySubmitButton>Save</PrimarySubmitButton>
        </ActionGroup>
      </Actions>
    </Form>
  )
}

const Form = styled.form`
  padding: 16px;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`

const ActionGroup = styled.span`
  display: flex;
  align-items: center;
`

const Field = styled.div`
  margin-bottom: 16px;
`

const FieldHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`

const Label = styled.label`
  display: flex;
  align-items: center;
  color: #777777;
  font-size: 14px;
`

const Open = styled.a`
  display: inline-block;
  margin-left: 8px;
  text-transform: uppercase;
  color: inherit;
  font-size: 12px;
  text-decoration: none;

  &:after {
    content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
    margin-left: 4px;
  }
`
