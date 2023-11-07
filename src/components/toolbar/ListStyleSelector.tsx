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

import ArrowDown from '@manuscripts/assets/react/ArrowDownBlack'
import { DropdownList, useDropdown } from '@manuscripts/style-guide'
import React from 'react'
import styled, { css } from 'styled-components'

const buttonCss = css<{
  'data-active'?: boolean
}>`
  background-color: ${(props) =>
    props['data-active'] ? '#eee' : props.theme.colors.background.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: 0.2s all;

  &:hover {
    background: ${(props) =>
      props['data-active'] ? '#eee' : props.theme.colors.background.secondary};
    z-index: 2;
  }

  &:active {
    background: #ddd;
  }

  &:disabled {
    opacity: 0.2;
  }
`

export const ListButton = styled.button.attrs({
  type: 'button',
})<{
  'data-active'?: boolean
}>`
  ${buttonCss};
  padding: 2px ${(props) => props.theme.grid.unit * 1}px 2px
    ${(props) => props.theme.grid.unit * 3}px;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
`

export const ListStyleButton = styled.button.attrs({
  type: 'button',
})<{
  'data-active'?: boolean
}>`
  ${buttonCss};
  border-left: 0;
  svg {
    width: 8px;
  }
  path {
    stroke: #c9c9c9;
  }

  &:hover path {
    stroke: #6e6e6e;
  }
`

type ListStyle = { items: [string, string, string]; type: string }

export const ListStyleSelector: React.FC<{
  disabled?: boolean
  onClickListType: (type: string) => void
  list: ListStyle[]
}> = ({ disabled, onClickListType, list }) => {
  const { isOpen, toggleOpen, wrapperRef } = useDropdown()

  return (
    <Container onClick={(e) => !disabled && toggleOpen(e)} ref={wrapperRef}>
      <ListStyleButton disabled={disabled}>
        <ArrowDown />
      </ListStyleButton>
      {isOpen && (
        <DropdownList direction={'right'} top={6} onClick={toggleOpen}>
          <ListContainer>
            {list.map((style, index) => (
              <StylesBlock
                onClick={onClickListType}
                key={index}
                style={style}
              />
            ))}
          </ListContainer>
        </DropdownList>
      )}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
`

const ListContainer = styled.div`
  padding: ${(props) => props.theme.grid.unit * 4}px;
  display: grid;
  grid-template-columns:
    ${(props) => props.theme.grid.unit * 21}px
    ${(props) => props.theme.grid.unit * 21}px;
  gap: 6px;
`

const StylesBlock: React.FC<{
  style: ListStyle
  onClick: (type: string) => void
}> = ({ style, onClick }) => (
  <StyleBlock onClick={() => onClick(style.type)}>
    {style.items.map((style, index) => (
      <BlockItem key={index}>
        <Label>{style}</Label>
        <Block />
      </BlockItem>
    ))}
  </StyleBlock>
)

const StyleBlock = styled.div`
  border: 1px solid ${(props) => props.theme.colors.border.tertiary};
  padding: ${(props) => props.theme.grid.unit * 2}px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  row-gap: ${(props) => props.theme.grid.unit * 2}px;

  &:hover {
    background: ${(props) => props.theme.colors.button.default.border.hover};
  }

  &:active {
    border-color: ${(props) => props.theme.colors.border.primary};
  }
`

const BlockItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const Block = styled.div`
  height: 3px;
  width: ${(props) => props.theme.grid.unit * 14}px;
  background: ${(props) => props.theme.colors.border.tertiary};
`

const Label = styled.div`
  font-family: Lato, serif;
  font-size: ${(props) => props.theme.font.size.small};
  font-weight: ${(props) => props.theme.font.weight.normal};
  line-height: ${(props) => props.theme.font.lineHeight.small};
  font-style: normal;
`
