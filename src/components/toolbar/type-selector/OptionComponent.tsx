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
import { TickIcon } from '@manuscripts/style-guide'
import React, { useLayoutEffect, useRef } from 'react'
import { components, ControlProps, OptionProps } from 'react-select'
import styled from 'styled-components'

import { optionName, titleCase } from '../helpers'
import { Option } from './TypeSelector'

const OptionContainer = styled.div<{ isFocused?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
  background: ${(props) => (props.isFocused ? '#f2fbfc' : 'transparent')};

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }
`
const OptionLabel = styled.span``

const TickIconWrapper = styled.div``
export const OptionComponent: React.FC<OptionProps<Option, false>> = ({
  innerProps,
  data,
  isFocused,
  innerRef,
}) => {
  return (
    <OptionContainer {...innerProps} isFocused={isFocused} ref={innerRef}>
      <OptionLabel>{titleCase(optionName(data.nodeType))}</OptionLabel>
      {data.isSelected && (
        <TickIconWrapper>
          <TickIcon />
        </TickIconWrapper>
      )}
    </OptionContainer>
  )
}

export const CustomControl = (props: ControlProps<Option, false>) => {
  const controlRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (controlRef.current) {
      controlRef.current.setAttribute('data-toolbar-button', 'true')
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const { selectProps } = props
      if (selectProps.menuIsOpen) {
        selectProps.onMenuClose?.()
      } else {
        selectProps.onMenuOpen?.()
      }
    }
  }

  return (
    <components.Control
      {...props}
      innerRef={controlRef}
      innerProps={{
        ...props.innerProps,
        onKeyDown: handleKeyDown,
      }}
    />
  )
}
