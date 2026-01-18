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

