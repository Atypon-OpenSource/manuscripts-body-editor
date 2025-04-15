/*!
 * © 2023 Atypon Systems LLC
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
export type UploadHandler = (file: File) => Promise<void>

export const figureUploader = (handler: UploadHandler) => {
  const handleFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target && target.files && target.files.length) {
      await handler(target.files[0])
    }
  }

  const input = document.createElement('input')
  // NOTE: figures in pullquotes should support only image, so if to be extended, it needs conditioning
  input.accept = 'image/*'
  input.type = 'file'
  input.addEventListener('change', handleFileChange)

  return () => input.click()
}
