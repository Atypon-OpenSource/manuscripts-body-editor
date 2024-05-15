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

import SearchIconNoBGc from '@manuscripts/assets/react/SearchIconNoBG'
import { TextField } from '@manuscripts/style-guide'
import React, { InputHTMLAttributes, useState } from 'react'
import styled from 'styled-components'

const SearchContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1 0 auto;
  position: relative;
  margin: 12px;
`

const SearchIconContainer = styled.span`
  display: flex;
  left: ${(props) => props.theme.grid.unit * 4}px;
  position: absolute;
  z-index: 2;

  path {
    fill: ${(props) => props.theme.colors.text.primary};
  }

  &.active path {
    fill: ${(props) => props.theme.colors.brand.medium};
  }
`

const SearchTextField = styled(TextField)`
  -webkit-appearance: textfield;
  padding-left: ${(props) => props.theme.grid.unit * 11}px;
  &:hover,
  &:focus {
    background-color: ${(props) => props.theme.colors.background.fifth};
  }
`

export const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: ${(props) => props.theme.grid.unit * 3}px;
`

export const SearchInput: React.FC<InputHTMLAttributes<HTMLInputElement>> = (
  props
) => {
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)

  const onFocus = () => {
    setFocus(true)
  }
  const onBlur = () => {
    setFocus(false)
  }

  const onMouseEnter = () => {
    setHover(true)
  }
  const onMouseLeave = () => {
    setHover(false)
  }

  return (
    <SearchContainer
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <SearchIconContainer className={hover || focus ? 'active' : ''}>
        <SearchIconNoBGc />
      </SearchIconContainer>

      <SearchTextField
        {...props}
        type="search"
        placeholder="Search"
        autoComplete="off"
      />
    </SearchContainer>
  )
}
