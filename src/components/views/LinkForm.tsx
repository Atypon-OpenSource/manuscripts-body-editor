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
  DeleteIcon,
  FormContainer,
  FormRow,
  Label,
  PrimaryButton,
  SecondaryButton,
  TextField,
  InputErrorText,
} from '@manuscripts/style-guide'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'

import { allowedHref } from '../../lib/url'

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

const RemoveButton = styled(SecondaryButton)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  svg .icon_element {
    fill: #6e6e6e;
  }
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!href) {
      newErrors.href = 'URL is required'
    } else if (!allowedHref(href)) {
      newErrors.href = 'Please enter a valid URL'
    }
    if (!text) {
      newErrors.text = 'Text is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [href, text])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (validate()) {
        onSave({ href, text, title })
      }
    },
    [href, text, title, onSave, validate]
  )

  return (
    <form onSubmit={handleSubmit} noValidate={true}>
      <FormContainer>
        <FormRow>
          <Label>URL*</Label>

          <TextField
            type={'text'}
            name={'href'}
            value={href}
            autoComplete={'off'}
            error={!!errors.href}
            onChange={(e) => setHref(e.target.value)}
          />

          {errors.href && <InputErrorText>{errors.href}</InputErrorText>}

          {href && allowedHref(href) && (
            <Open href={href} target={'_blank'} rel={'noopener'} />
          )}
        </FormRow>

        <FormRow>
          <Label>Text</Label>

          <TextField
            type={'text'}
            name={'text'}
            value={text}
            autoComplete={'off'}
            error={!!errors.text}
            onChange={(e) => setText(e.target.value)}
          />
          {errors.text && <InputErrorText>{errors.text}</InputErrorText>}
        </FormRow>

        <FormRow>
          <Label>Title</Label>

          <TextField
            type={'text'}
            name={'title'}
            value={title}
            autoComplete={'off'}
            required={false}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormRow>

        <Actions>
          <ActionGroup>
            <RemoveButton type={'button'} onClick={onRemove}>
              <DeleteIcon />
              <span>Remove Link</span>
            </RemoveButton>
          </ActionGroup>

          <ActionGroup>
            <SecondaryButton type={'button'} onClick={onCancel}>
              Cancel
          </SecondaryButton>
          <PrimaryButton type={'submit'}>Save</PrimaryButton>
          </ActionGroup>
        </Actions>
      </FormContainer>
    </form>
  )
}
