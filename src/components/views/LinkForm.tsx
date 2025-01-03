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
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '@manuscripts/style-guide'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

import { allowedHref } from '../../lib/url'

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

  button:not(:last-of-type) {
    margin-right: 4px;
  }
`

const Field = styled.div`
  margin-bottom: ${(props) => props.theme.grid.unit * 4}px;
`

const FieldHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.grid.unit}px;
`

const Label = styled.label`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.colors.text.tertiary};
  font-size: ${(props) => props.theme.font.size.normal};
`

export const Open = styled.a`
  display: inline-block;
  margin-left: ${(props) => props.theme.grid.unit * 2}px;
  text-transform: uppercase;
  color: inherit;
  font-size: ${(props) => props.theme.font.size.small};
  text-decoration: none;

  &:after {
    content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
    margin-left: 4px;
  }
`

export interface LinkValue {
  text: string
  href: string
  title?: string
}

export interface LinkFormProps {
  onCancel: () => void
  onRemove: () => void
  onSave: (value: LinkValue) => void
  value: LinkValue
}

export const LinkForm: React.FC<LinkFormProps> = ({
  onCancel,
  onRemove,
  onSave,
  value,
}) => {
  const [href, setHref] = useState(value.href)
  const [text, setText] = useState(value.text)
  const [title, setTitle] = useState(value.title || '')

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onSave({ href, text, title })
    },
    [href, text, title, onSave]
  )

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <FieldHeading>
          <Label>URL</Label>

          {href && allowedHref(href) && (
            <Open href={href} target={'_blank'} rel={'noopener'} />
          )}
        </FieldHeading>

        <TextField
          type={'url'}
          name={'href'}
          value={href}
          autoComplete={'off'}
          autoFocus={true}
          required={true}
          onChange={(e) => setHref(e.target.value)}
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
          onChange={(e) => setText(e.target.value)}
        />
      </Field>

      <Field>
        <FieldHeading>
          <Label>Title (optional)</Label>
        </FieldHeading>

        <TextField
          type={'text'}
          name={'title'}
          value={title}
          autoComplete={'off'}
          required={false}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Actions>
        <ActionGroup>
          <SecondaryButton type={'button'} mini={true} onClick={onRemove}>
            Remove Link
          </SecondaryButton>
        </ActionGroup>

        <ActionGroup>
          <SecondaryButton type={'button'} onClick={onCancel}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type={'submit'}>Save</PrimaryButton>
        </ActionGroup>
      </Actions>
    </Form>
  )
}
