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
import {
  Menu,
  MenuComponentProps,
  NestedSubmenusContainer,
  SubmenuContainer,
  SubmenuLabel,
} from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

export const ListMenuItem: React.FC<MenuComponentProps> = ({
  menu,
  handleClick,
}) => {
  if (!menu.submenu) {
    return null
  }
  const styles = menu.submenu.map((m) => (m as Menu).id)
  return (
    <SubmenuContainer>
      <SubmenuLabel menu={menu} handleClick={handleClick} />
      {menu.isOpen && (
        <NestedSubmenusContainer>
          <ListStyles styles={styles} onClick={(s, i) => handleClick([i])} />
        </NestedSubmenusContainer>
      )}
    </SubmenuContainer>
  )
}

export interface ListSubmenuItemsProps {
  styles: string[]
  onClick: (style: string, index: number) => void
}

export const ListStyles: React.FC<ListSubmenuItemsProps> = ({
  styles,
  onClick,
}) => {
  return (
    <ListContainer>
      {styles.map((style, index) => (
        <StyleBlock
          data-cy="submenu"
          key={index}
          onClick={() => onClick(style, index)}
        >
          {styleItems[style].map((item, index) => (
            <BlockItem key={index}>
              <Label hide={item === '-'}>{item}</Label>
              <Block />
            </BlockItem>
          ))}
        </StyleBlock>
      ))}
    </ListContainer>
  )
}

const styleItems: { [key: string]: string[] } = {
  order: ['1.', '2.', '3.'],
  'alpha-upper': ['A.', 'B.', 'C.'],
  'alpha-lower': ['a.', 'b.', 'c.'],
  'roman-upper': ['I.', 'II.', 'III.'],
  'roman-lower': ['i.', 'ii.', 'iii.'],
  bullet: ['•', '•', '•'],
  simple: ['-', '-', '-'],
}

export const ListContainer = styled.div`
  padding: ${(props) => props.theme.grid.unit * 4}px;
  display: grid;
  grid-template-columns:
    ${(props) => props.theme.grid.unit * 21}px
    ${(props) => props.theme.grid.unit * 21}px;
  gap: 6px;
`

export const StyleBlock = styled.div`
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

export const BlockItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const Block = styled.div`
  height: 3px;
  width: ${(props) => props.theme.grid.unit * 14}px;
  background: ${(props) => props.theme.colors.border.tertiary};
`

export const Label = styled.div<{ hide?: boolean }>`
  font-family: Lato, serif;
  font-size: ${(props) => props.theme.font.size.small};
  font-weight: ${(props) => props.theme.font.weight.normal};
  line-height: ${(props) => props.theme.font.lineHeight.small};
  font-style: normal;
  color: ${(props) => (props.hide && 'white') || 'initial'};
`
