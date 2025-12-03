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
interface MediaTypeInfo {
  extension: string
  isVideo: boolean
  isAudio: boolean
  isImage: boolean
  isSupported: boolean
  mimetype?: string
  mimeSubtype?: string
}

export const getMediaTypeInfo = (
  filenameOrFile: string | File
): MediaTypeInfo => {
  const filename =
    typeof filenameOrFile === 'string'
      ? filenameOrFile
      : filenameOrFile?.name || ''
  const extension = filename.toLowerCase().split('.').pop()?.trim() || ''

  const videoExtensions = new Set([
    'mp4',
    'webm',
    'avi',
    'mov',
    'mkv',
    'flv',
    'wmv',
    'mpg',
    'mpeg',
  ])
  const audioExtensions = new Set([
    'mp3',
    'wav',
    'aac',
    'ogg',
    'flac',
    'm4a',
    'wma',
  ])
  const imageExtensions = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'svg',
    'webp',
    'tiff',
    'tif',
  ])

  let mimetype: string | undefined
  let mimeSubtype: string | undefined

  if (typeof filenameOrFile !== 'string' && filenameOrFile?.type) {
    const [type, subtype] = filenameOrFile.type.split('/')
    if (type && subtype && ['video', 'audio', 'image'].includes(type)) {
      mimetype = type
      mimeSubtype = subtype
    }
  }

  if (!mimetype || !mimeSubtype) {
    if (videoExtensions.has(extension)) {
      mimetype = 'video'
      mimeSubtype = extension === 'mov' ? 'quicktime' : extension
    } else if (audioExtensions.has(extension)) {
      mimetype = 'audio'
      mimeSubtype = extension === 'm4a' ? 'mp4' : extension
    } else if (imageExtensions.has(extension)) {
      mimetype = 'image'
      mimeSubtype = extension === 'jpg' ? 'jpeg' : extension
    }
  }

  const isVideo = mimetype === 'video' || videoExtensions.has(extension)
  const isAudio = mimetype === 'audio' || audioExtensions.has(extension)
  const isImage = mimetype === 'image' || imageExtensions.has(extension)
  const isSupported = isVideo || isAudio || isImage

  return {
    extension,
    isVideo,
    isAudio,
    isImage,
    isSupported,
    mimetype,
    mimeSubtype,
  }
}
