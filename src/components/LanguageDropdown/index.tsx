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

import {
  DropdownContainer,
  DropdownList,
  TickIcon,
  TriangleCollapsedIcon,
} from '@manuscripts/style-guide'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { getLanguage, getLanguageLabel, Language } from '../../lib/languages'

interface LanguageDropdownProps {
  onLanguageSelect: (languageCode: string) => void
  onClose?: () => void
  currentLanguage?: string
  showButton?: boolean
  buttonLabel?: string
  selectedLanguageDisplay?: string
  onCloseParent?: () => void
  languages: Language[]
  menuItemRef?: (el: HTMLDivElement | null) => void
}

const LanguageOptionItem: React.FC<{
  language: Language
  isSelected: boolean
  onSelect: (
    event: React.MouseEvent | React.KeyboardEvent,
    languageCode: string
  ) => void
}> = ({ language, isSelected, onSelect }) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSelect(event, language.code)
    }
  }

  return (
    <StyledLanguageOption
      key={language.code}
      onClick={(event) => onSelect(event, language.code)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="submenuitem"
    >
      {language.name}
      {language.nativeName && ` (${language.nativeName})`}
      {isSelected && (
        <TickIconWrapper>
          <TickIcon />
        </TickIconWrapper>
      )}
    </StyledLanguageOption>
  )
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  onLanguageSelect,
  onClose,
  currentLanguage = 'en',
  showButton = false,
  selectedLanguageDisplay,
  onCloseParent,
  languages,
  menuItemRef,
}) => {
  const [isOpen, setIsOpen] = useState(!showButton)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const languageButtonRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Element)
      ) {
        setIsOpen(false)
        onClose?.()
        onCloseParent?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, onCloseParent])

  // Focus first option when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownMenuRef.current) {
      const firstOption = dropdownMenuRef.current.querySelector<HTMLElement>(
        '[role="submenuitem"]'
      )
      firstOption?.focus()
    }
  }, [isOpen])

  const toggleDropdown = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'ArrowRight') {
      event.preventDefault()
      toggleDropdown(event)
    }
  }

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!dropdownMenuRef.current) return

    const menuItems = Array.from(
      dropdownMenuRef.current.querySelectorAll<HTMLElement>(
        '[role="submenuitem"]'
      )
    )

    if (menuItems.length === 0) return

    const currentIndex = menuItems.findIndex(
      (item) => item === document.activeElement
    )

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextIndex = (currentIndex + 1) % menuItems.length
      menuItems[nextIndex]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prevIndex =
        currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1
      menuItems[prevIndex]?.focus()
    } else if (event.key === 'Escape' || event.key === 'ArrowLeft') {
      event.preventDefault()
      setIsOpen(false)
      setTimeout(() => languageButtonRef.current?.focus(), 0)
    }
  }

  const handleSelect = (
    event: React.MouseEvent | React.KeyboardEvent,
    languageCode: string
  ) => {
    event.stopPropagation()
    onLanguageSelect(languageCode)
  }

  const getDisplayName = (languageCode: string) => {
    const lang = getLanguage(languageCode, languages)
    return getLanguageLabel(lang)
  }

  return (
    <DropdownContainer ref={dropdownRef}>
      {showButton && (
        <LanguageButton
          ref={(el) => {
            languageButtonRef.current = el
            menuItemRef?.(el)
          }}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="menuitem"
        >
          <ButtonContent>
            <ButtonLabel>
              Document language <TriangleCollapsedIcon />
            </ButtonLabel>
            <SelectedLanguage>
              {selectedLanguageDisplay || getDisplayName(currentLanguage)}
            </SelectedLanguage>
          </ButtonContent>
        </LanguageButton>
      )}

      {isOpen && (
        <DropdownMenu
          ref={dropdownMenuRef}
          direction="right"
          width={231}
          height={400}
          top={18}
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          {!showButton && <DropdownTitle>Choose language</DropdownTitle>}
          {languages.map((language) => (
            <LanguageOptionItem
              key={language.code}
              language={language}
              isSelected={currentLanguage === language.code}
              onSelect={handleSelect}
            />
          ))}
        </DropdownMenu>
      )}
    </DropdownContainer>
  )
}

const StyledDropdownList = styled(DropdownList)`
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors.background.secondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6e6e6e;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #6e6e6e;
  }
`

const LanguageButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ${(props) => props.theme.font.family.Lato};
  cursor: pointer;
  font-size: 14px;
  line-height: 24px;
  color: ${(props) => props.theme.colors.text.primary};
  padding: 10px 16px;
  width: 100%;

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.outline.focus};
    outline-offset: -2px;
    background: ${(props) => props.theme.colors.background.fifth};
  }
`

const ButtonContent = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const ButtonLabel = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;

  svg {
    top: 10px;
    right: -10px;
    position: relative;
  }
`

const SelectedLanguage = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.colors.text.secondary};
  margin-top: 2px;
`

const DropdownMenu = styled(StyledDropdownList)`
  // Inherits all styles from StyledDropdownList
`

const DropdownTitle = styled.div`
  font-family: 'PT Sans', sans-serif;
  font-size: 16px;
  font-style: italic;
  font-weight: 400;
  line-height: 32px;
  color: #c9c9c9;
  padding: 12px 16px 8px 16px;
  border-bottom: 1px solid #c9c9c9;
  margin-bottom: 4px;
`

const TickIconWrapper = styled.div`
  svg path {
    fill: #6e6e6e;
  }
`

const StyledLanguageOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ${(props) => props.theme.font.family.Lato};
  cursor: pointer;
  font-size: 14px;
  line-height: 24px;
  color: ${(props) => props.theme.colors.text.primary};
  padding: 10px 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f2fbfc;
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.outline.focus};
    outline-offset: -2px;
    background: ${(props) => props.theme.colors.background.fifth};
  }
`

export default LanguageDropdown
