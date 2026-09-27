/*!
 * © 2026 Atypon Systems LLC
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

import { ExtLink } from '@manuscripts/transform'

import {
  captionArrowIcon,
  captionIcon,
  deleteIcon,
  fileCorruptedIcon,
  xIcon,
} from '../icons'
import { getLanguage, getLanguageLabel, Language } from './languages'
import { createKeyboardInteraction, handleEnterKey } from './navigation-utils'

export const createCaptionFilePlaceholder = (
  onClose: () => void
): HTMLElement => {
  const element = document.createElement('div')
  element.classList.add('figure', 'placeholder', 'caption-file-placeholder')
  element.tabIndex = 0
  appendCaptionCloseButton(element, onClose)

  const instructions = document.createElement('div')
  instructions.classList.add('instructions')
  instructions.innerHTML = `
    <div>
      <p>Drag &amp; drop a caption file here, or <a class="caption-file-browse-link">Browse</a></p>
      <p class="caption-file-placeholder-hint">Supports .vtt and .srt files</p>
    </div>
  `
  element.appendChild(instructions)

  return element
}

const captionFileExtensions = new Set(['vtt', 'srt'])
export const captionFileAccept = '.vtt,.srt'
export const captionLinkType = 'transcript'

export const isCaptionFile = (file: File | string) => {
  const name = typeof file === 'string' ? file : file.name
  const extension = name.toLowerCase().split('.').pop()?.trim() || ''
  return captionFileExtensions.has(extension)
}

const isCaptionLink = (
  link: ExtLink,
  href?: string
): link is ExtLink & { href: string } =>
  link.type === captionLinkType && !!link.href && (!href || link.href === href)

export const removeCaptionLink = (links: ExtLink[] = [], href: string) =>
  links.filter((link) => !isCaptionLink(link, href))

export const replaceCaptionLink = (
  links: ExtLink[] = [],
  href: string,
  file: { id: string; name: string }
) =>
  links.map((link) =>
    isCaptionLink(link, href)
      ? { ...link, href: file.id, label: file.name }
      : link
  )

export const addCaptionLink = (
  links: ExtLink[] = [],
  file: { id: string; name: string }
) => [
  ...removeCaptionLink(links, file.id),
  {
    type: captionLinkType,
    href: file.id,
    lang: '',
    label: file.name,
  },
]

export const setCaptionLinkLanguage = (
  links: ExtLink[] = [],
  href: string,
  language: string
) => {
  if (
    links.some(
      (link) =>
        isCaptionLink(link) && link.href !== href && link.lang === language
    )
  ) {
    return links
  }

  return links.map((link) =>
    isCaptionLink(link, href) ? { ...link, lang: language } : link
  )
}

export interface CaptionFileItem {
  id: string
  name: string
  language: string
}

const appendCaptionCloseButton = (
  element: HTMLElement,
  onClose: () => void
) => {
  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.classList.add('caption-file-placeholder-close')
  closeButton.dataset.action = 'close'
  closeButton.setAttribute('aria-label', 'Close')
  closeButton.innerHTML = xIcon
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation()
    onClose()
  })
  element.appendChild(closeButton)
}

export const createUnsupportedCaptionFile = (
  filename: string,
  onClose: () => void
): HTMLElement => {
  const element = document.createElement('div')
  element.classList.add(
    'figure',
    'placeholder',
    'caption-file-placeholder',
    'caption-file-unsupported'
  )
  element.tabIndex = 0
  appendCaptionCloseButton(element, onClose)

  const instructions = document.createElement('div')
  instructions.classList.add('instructions')
  const content = document.createElement('div')

  const iconWrapper = document.createElement('div')
  iconWrapper.classList.add('unsupported-icon-wrapper')
  iconWrapper.innerHTML = fileCorruptedIcon

  const name = document.createElement('div')
  name.classList.add('caption-file-unsupported-name')
  name.textContent = filename

  const formatLabel = document.createElement('div')
  formatLabel.classList.add('unsupported-format-label')
  formatLabel.textContent = 'Unsupported file format'

  const action = document.createElement('div')
  action.classList.add('caption-file-unsupported-action')
  action.textContent = 'Click to add a caption file'

  content.append(iconWrapper, name, formatLabel, action)
  instructions.appendChild(content)
  element.appendChild(instructions)

  return element
}

const createCaptionLanguageMenu = (
  languages: Language[],
  selectedCode: string,
  disabledCodes: Set<string>,
  onSelect: (code: string) => void,
  onClose: () => void
) => {
  const menu = document.createElement('div')
  menu.className = 'language menu'
  const menuItems: HTMLElement[] = []
  const removeKeydownListener = createKeyboardInteraction({
    container: document,
    navigation: {
      getItems: () => menuItems,
      arrowKeys: {
        forward: 'ArrowDown',
        backward: 'ArrowUp',
      },
    },
    additionalKeys: {
      Escape: () => onClose(),
    },
  })

  languages.forEach((language) => {
    const item = document.createElement('div')
    const disabled = disabledCodes.has(language.code)
    item.className = `menu-item${
      language.code === selectedCode ? ' selected' : ''
    }${disabled ? ' disabled' : ''}`
    item.textContent = getLanguageLabel(language)
    item.setAttribute('role', 'menuitem')
    item.setAttribute('aria-disabled', String(disabled))
    if (disabled) {
      item.tabIndex = -1
      menu.appendChild(item)
      return
    }

    item.tabIndex = -1
    const select = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      onSelect(language.code)
      onClose()
    }
    item.addEventListener('mousedown', select)
    item.addEventListener('keydown', handleEnterKey(select))
    menuItems.push(item)
    menu.appendChild(item)
  })

  return {
    menu,
    destroy: () => removeKeydownListener(),
  }
}

export const createCaptionFileList = (
  items: CaptionFileItem[],
  languages: Language[],
  onLanguageChange: (id: string, language: string) => void,
  onDelete: (id: string) => void,
  showLanguageMenu: (anchor: HTMLElement, menu: HTMLElement) => () => void
): HTMLElement => {
  const list = document.createElement('div')
  list.classList.add('caption-file-list')

  const title = document.createElement('div')
  title.classList.add('caption-file-list-title')
  title.textContent = 'Caption file'
  list.appendChild(title)

  items.forEach((item) => {
    const row = document.createElement('div')
    row.classList.add('caption-file-item')

    const file = document.createElement('div')
    file.classList.add('caption-file-item-file')
    file.innerHTML = `<span class="caption-file-item-icon">${captionIcon}</span><span class="caption-file-item-name"></span>`
    const name = file.querySelector('.caption-file-item-name')
    if (name) {
      name.textContent = item.name
    }
    row.appendChild(file)

    const options = languages.length
      ? languages
      : [{ code: 'en', name: 'English', nativeName: 'English' }]
    const selected = item.language
      ? options.find((option) => option.code === item.language) ||
        getLanguage(item.language, options)
      : undefined
    const usedLanguages = new Set(
      items
        .filter((caption) => caption.id !== item.id && caption.language)
        .map((caption) => caption.language)
    )

    const language = document.createElement('div')
    language.classList.add('caption-file-language')
    const languageLabel = document.createElement('span')
    languageLabel.classList.add('caption-file-language-title')
    languageLabel.textContent = 'Language'
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.classList.add('caption-file-language-trigger')
    trigger.setAttribute('aria-label', `Language for ${item.name}`)
    trigger.setAttribute('aria-haspopup', 'menu')
    const value = document.createElement('span')
    value.classList.add('caption-file-language-value')
    value.textContent = selected ? getLanguageLabel(selected) : 'Select'
    trigger.appendChild(value)
    trigger.insertAdjacentHTML(
      'beforeend',
      `<span class="caption-file-language-arrow">${captionArrowIcon}</span>`
    )

    let closeMenu: (() => void) | undefined
    const openMenu = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      closeMenu?.()
      const menuOptions =
        selected && !options.some((option) => option.code === selected.code)
          ? [selected, ...options]
          : options
      const menu = createCaptionLanguageMenu(
        menuOptions,
        selected?.code || '',
        usedLanguages,
        (code) => onLanguageChange(item.id, code),
        () => closeMenu?.()
      )
      closeMenu = showLanguageMenu(trigger, menu.menu)
      const destroyMenu = closeMenu
      closeMenu = () => {
        menu.destroy()
        destroyMenu()
      }
    }
    trigger.addEventListener('mousedown', openMenu)
    trigger.addEventListener('keydown', handleEnterKey(openMenu))

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.classList.add('caption-file-delete')
    remove.setAttribute('aria-label', `Delete ${item.name}`)
    remove.setAttribute('data-tooltip-content', 'Delete')
    remove.innerHTML = deleteIcon
    remove.addEventListener('click', (event) => {
      event.stopPropagation()
      onDelete(item.id)
    })

    language.appendChild(languageLabel)
    language.appendChild(trigger)
    language.appendChild(remove)
    row.appendChild(language)

    list.appendChild(row)
  })

  return list
}
