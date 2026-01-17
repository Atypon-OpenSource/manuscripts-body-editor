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
  makeKeyboardActivatable,
  addArrowKeyNavigation,
  type MakeKeyboardActivatableOptions,
  type AddArrowKeyNavigationOptions,
} from '@manuscripts/style-guide'

/**
 * Options for KeyboardNavigationManager
 */
export interface KeyboardNavigationManagerOptions {
  /** Options for keyboard activation (Enter/Space keys) */
  activation?: MakeKeyboardActivatableOptions & {
    /** Element to make activatable. If not provided, uses the container */
    element?: HTMLElement
    /** Handler function to call when activated */
    handler?: (event: Event) => void
  }
  /** Options for arrow key navigation */
  navigation?: AddArrowKeyNavigationOptions
}

/**
 * Manages keyboard accessibility for a container element.
 * Combines keyboard activation and arrow navigation with automatic cleanup.
 * 
 * @example
 * ```typescript
 * // Simple activation
 * const manager = new KeyboardNavigationManager(button, {
 *   activation: { handler: () => console.log('activated') }
 * })
 * 
 * // Navigation only
 * const manager = new KeyboardNavigationManager(container, {
 *   navigation: { selector: '.item', direction: 'vertical', loop: true }
 * })
 * 
 * // Both
 * const manager = new KeyboardNavigationManager(container, {
 *   activation: { element: button, handler: () => openMenu() },
 *   navigation: { selector: '.menu-item', direction: 'vertical' }
 * })
 * 
 * // Cleanup
 * manager.cleanup()
 * ```
 */
export class KeyboardNavigationManager {
  private cleanupFunctions: Array<() => void> = []

  /**
   * @param container - The container element
   * @param options - Configuration options
   */
  constructor(
    private container: HTMLElement,
    options?: KeyboardNavigationManagerOptions
  ) {
    if (options) {
      this.initialize(options)
    }
  }

  /**
   * Initialize keyboard utilities based on provided options
   */
  private initialize(options: KeyboardNavigationManagerOptions) {
    if (options.activation?.handler) {
      const { element, handler, ...activationOptions } = options.activation
      const targetElement = element || this.container

      const cleanup = makeKeyboardActivatable(
        targetElement,
        handler,
        activationOptions
      )
      this.cleanupFunctions.push(cleanup)
    }

    if (options.navigation) {
      const cleanup = addArrowKeyNavigation(this.container, options.navigation)
      this.cleanupFunctions.push(cleanup)
    }
  }

  /**
   * Add keyboard activation to an element
   * Useful for dynamically adding activation after initialization
   */
  public addActivation(
    element: HTMLElement,
    handler: (event: Event) => void,
    options?: MakeKeyboardActivatableOptions
  ): void {
    const cleanup = makeKeyboardActivatable(element, handler, options)
    this.cleanupFunctions.push(cleanup)
  }

  /**
   * Add arrow key navigation
   * Useful for dynamically adding navigation after initialization
   */
  public addNavigation(options: AddArrowKeyNavigationOptions): void {
    const cleanup = addArrowKeyNavigation(this.container, options)
    this.cleanupFunctions.push(cleanup)
  }

  /**
   * Clean up all event listeners
   * Call this in your component's destroy/unmount lifecycle
   */
  public cleanup(): void {
    this.cleanupFunctions.forEach((fn) => fn())
    this.cleanupFunctions = []
  }
}
