/*!
 * © 2021 Atypon Systems LLC
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
 * A helper to check for existing external files of 'imageRepresentation' kind and replace/add it when needed.
 * Assuming that there should always be only one 'imageRepresentation' file reference as it serves for the basic display in the article body.
 */
export const addImageRepresentation = (
  externalFileReferences:
    | Array<{
        url: string
        kind?: 'imageRepresentation' | 'interactiveRepresentation' | 'dataset'
      }>
    | undefined,
  absolutePublicUrl: string
) => {
  const newRefs = externalFileReferences || []
  const fullFilePath = absolutePublicUrl
  newRefs.reduce((tracking, item, index, source) => {
    if (item.kind == 'imageRepresentation') {
      item.url = fullFilePath
      tracking.push(item)
    }
    if (index === source.length - 1 && !tracking.length) {
      source.push({
        kind: 'imageRepresentation',
        url: fullFilePath,
      })
    }
    return tracking
  }, [] as Array<{ kind?: string; url: string }>)

  return newRefs
}
