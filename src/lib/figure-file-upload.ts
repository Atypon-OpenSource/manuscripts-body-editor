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

export function createOnUploadHandler(
  uploadAttachment: (designation: string, file: File) => Promise<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  designation: string,
  relation: string,
  addFigureExFileRef: (
    relation: string,
    publicUrl: string,
    attachmentId: string
  ) => void
) {
  return async function (e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files && target.files[0]
    if (file) {
      const response = await uploadAttachment(designation, file)
      if (response) {
        const { link, id } = response
        addFigureExFileRef(relation, link, id)
      }
      target.value = ''
    }
  }
}
