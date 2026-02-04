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
import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

export const ListMenuItem: React.FC<MenuComponentProps> = ({
  menu,
  handleClick,
  close,
}) => {
  const styleRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (menu.isOpen && styleRefs.current.length > 0) {
      // Auto-focus first style when menu opens
      styleRefs.current[0]?.focus()
    }
  }, [menu.isOpen])

  if (!menu.submenu) {
    return null
  }
  const styles = menu.submenu.map((m) => (m as Menu).id)

  const handleStyleClick = (s: string, i: number) => {
    handleClick([i])
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = styleRefs.current.filter(Boolean) as HTMLDivElement[]
    if (items.length === 0) {
      return
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLDivElement)
    if (currentIndex === -1) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        items[(currentIndex + 1) % items.length]?.focus()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        items[(currentIndex - 1 + items.length) % items.length]?.focus()
        break
      case 'Escape':
        close()
        break
      case 'Enter': {
        const el = document.activeElement as HTMLElement
        el?.click()
        break
      }
    }
  }

  return (
    <SubmenuContainer>
      <SubmenuLabel menu={menu} handleClick={handleClick} closeAll={close} />
      {menu.isOpen && (
        <NestedSubmenusContainer onKeyDown={handleKeyDown}>
          <ListStyles
            styles={styles}
            onClick={handleStyleClick}
            styleRefs={styleRefs}
          />
        </NestedSubmenusContainer>
      )}
    </SubmenuContainer>
  )
}

export interface ListSubmenuItemsProps {
  styles: string[]
  onClick: (style: string, index: number) => void
  styleRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>
}

export const ListStyles: React.FC<ListSubmenuItemsProps> = ({
  styles,
  onClick,
  styleRefs,
}) => {
  return (
    <ListContainer>
      {styles.map((style, index) => (
        <StyleBlock
          data-cy="submenu"
          key={index}
          ref={(el) => {
            if (styleRefs) {
              styleRefs.current[index] = el
            }
          }}
          onClick={() => onClick(style, index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onClick(style, index)
            }
          }}
          tabIndex={0}
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

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.outline.focus};
    outline-offset: -2px;
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
