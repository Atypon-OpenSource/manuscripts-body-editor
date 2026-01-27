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

/**
 * TODO: Reuse this utility in other areas related to navigation implemented in LEAN-5090
 * (e.g., inspector components, toolbar and other components with similar navigation patterns)
 */
export function focusNextElement(
  elements: Element[] | HTMLElement[],
  currentIndex: number,
  direction: 'forward' | 'backward'
): void {
  const nextIndex =
    direction === 'forward'
      ? (currentIndex + 1) % elements.length
      : (currentIndex - 1 + elements.length) % elements.length
  const nextElement = elements[nextIndex] as HTMLElement
  nextElement?.focus()
}

/**
 * Creates a keydown handler that triggers an action when Enter key is pressed.
 * Automatically prevents default behavior.
 */
export function handleEnterKey(action: (event: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      action(event)
    }
  }
}

// Handles arrow key navigation between elements.
export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentElement: HTMLElement,
  keys: {
    forward: 'ArrowDown' | 'ArrowRight'
    backward: 'ArrowUp' | 'ArrowLeft'
  }
): void {
  const { forward, backward } = keys
  if (event.key !== forward && event.key !== backward) {
    return
  }

  event.preventDefault()
  if (elements.length === 0) {
    return
  }
  const currentIndex = elements.indexOf(currentElement)
  if (currentIndex === -1) {
    // Focus first element when current element not found
    elements[0]?.focus()
    return
  }

  const direction = event.key === forward ? 'forward' : 'backward'
  focusNextElement(elements, currentIndex, direction)
}

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
type SupportedKey = ArrowKey | 'Enter' | 'Escape' | 'Tab'

type KeyHandlers = Partial<Record<SupportedKey, (event: KeyboardEvent) => void>>

type NavigationConfig = {
  /** Array of focusable items within the container */
  getItems: () => HTMLElement[]
  /** Arrow key configuration for navigation */
  arrowKeys: {
    forward: 'ArrowDown' | 'ArrowRight'
    backward: 'ArrowUp' | 'ArrowLeft'
  }
  /** Optional override for the current focused element */
  getCurrentElement?: (event: KeyboardEvent) => HTMLElement | null
}

export type KeyboardInteractionOptions = {
  /** The container element (menu, dropdown, list, etc.) or window/document */
  container: HTMLElement | Window | Document
  /** Optional keyboard navigation capability (within items) */
  navigation?: NavigationConfig
  /** Optional custom key handlers */
  additionalKeys?: KeyHandlers
  /** Whether to attach listener to document (default) or container element */
  attachToDocument?: boolean
}

export function createKeyboardInteraction(
  options: KeyboardInteractionOptions
): () => void {
  const {
    container,
    additionalKeys,
    navigation,
    attachToDocument = true,
  } = options

  const handleKeydown: EventListener = (event) => {
    const e = event as KeyboardEvent

    const key = e.key as SupportedKey
    const handler = additionalKeys?.[key]

    if (handler) {
      e.preventDefault()
      handler(e)
      return
    }

    // Handle navigation
    if (!navigation) {
      return
    }
    const { getItems, arrowKeys, getCurrentElement } = navigation

    const currentElement = getCurrentElement
      ? getCurrentElement(e)
      : (e.target as HTMLElement)

    if (!currentElement) {
      return
    }

    const list = getItems()
    if (!list.length) {
      return
    }
    handleArrowNavigation(e, list, currentElement, arrowKeys)
  }

  const target = attachToDocument ? document : container
  target.addEventListener('keydown', handleKeydown)

  return () => {
    target.removeEventListener('keydown', handleKeydown)
  }
}
