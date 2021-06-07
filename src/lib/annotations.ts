/*!
 * © 2019 Atypon Systems LLC
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
  CommentAnnotation,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { Annotation } from '@manuscripts/track-changes'

export const ANNOTATION_COLOR = [250, 224, 150] as [number, number, number]

export const loadAnnoationsToTrack = (
  modelMap: Map<string, Model>
): Array<Omit<Annotation, 'from' | 'to'>> => {
  const comments = Array.from(modelMap.values()).filter(
    (model) =>
      model.objectType === ObjectTypes.CommentAnnotation &&
      Boolean((model as CommentAnnotation).selector)
  ) as CommentAnnotation[]

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  return comments.map((comment) => ({
    ancestorFrom: comment.selector!.from,
    ancestorTo: comment.selector!.to,
    uid: comment.target,
    color: ANNOTATION_COLOR,
    updatedAt: comment.updatedAt,
  }))
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}
