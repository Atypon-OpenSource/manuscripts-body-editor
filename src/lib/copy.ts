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
import { Slice } from 'prosemirror-model'

// TODO: checking the ability to remove the following logic, after the following ticket LEAN-4118 is resolved
export const transformCopied = (slice: Slice) => {
  if (slice.openStart !== slice.openEnd && (slice.content.firstChild?.type.isBlock || slice.content.lastChild?.type.isBlock)) {
    const cutDepth = Math.min(slice.openStart, slice.openEnd)
    // rebalance slice sides to be digestible for track changes plugin
    return new Slice(slice.content, cutDepth, cutDepth)
  }
  return slice;
}
