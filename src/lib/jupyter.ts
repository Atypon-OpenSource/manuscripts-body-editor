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
  Contents,
  ContentsManager,
  KernelMessage,
  ServerConnection,
  Session,
} from '@jupyterlab/services'
import { blobToBase64String } from 'blob-util'
import { sha256 } from 'crypto-hash'
import { CodemirrorMode } from './codemirror-modes'

interface ListingAttachment {
  data: Blob
  mime: string
  md5: string
  name: string
}

interface RemoteAttachmentLookup {
  [name: string]: string
}

const remoteAttachmentLookupDocumentKey = (listingID: string) =>
  `/_attachment_lookup:${listingID}`

const ensureDirectoryExists = async (
  contentsManager: ContentsManager,
  listingID: string
) => {
  const directoryExists = await contentsManager
    .get(listingID)
    .then(() => true)
    .catch(e => e.response.ok) // TODO: check for 404

  if (!directoryExists) {
    const untitledDirectory = await contentsManager.newUntitled({
      path: `/`,
      type: 'directory',
    })

    // TODO: is this really the only way to create a named folder
    await contentsManager.rename(untitledDirectory.path, listingID)
  }
}

const saveAttachmentMd5Lookup = async (
  contentsManager: ContentsManager,
  listingID: string,
  lookup: RemoteAttachmentLookup
): Promise<RemoteAttachmentLookup> => {
  const model = await contentsManager.save(
    remoteAttachmentLookupDocumentKey(listingID),
    {
      content: JSON.stringify(lookup),
      type: 'file',
      format: 'text',
    }
  )

  return model.content
}

const getOrCreateAttachmentMd5Lookup = async (
  contentsManager: ContentsManager,
  listingID: string
): Promise<RemoteAttachmentLookup> => {
  try {
    const model = await contentsManager.get(
      remoteAttachmentLookupDocumentKey(listingID),
      { content: true }
    )

    return JSON.parse(model.content)
  } catch {
    return saveAttachmentMd5Lookup(contentsManager, listingID, {})
  }
}

const deleteAttachment = async (
  contentsManager: ContentsManager,
  listingID: string,
  attachmentName: string,
  attachmentPath: string
) => {
  const attachmentMd5Lookup = await getOrCreateAttachmentMd5Lookup(
    contentsManager,
    listingID
  )

  // delete attachment
  await contentsManager.delete(attachmentPath)

  // remove from lookup
  delete attachmentMd5Lookup[attachmentName]

  // save updated lookup
  await saveAttachmentMd5Lookup(contentsManager, listingID, attachmentMd5Lookup)
}

const saveAttachment = async (
  contentsManager: ContentsManager,
  listingID: string,
  attachment: ListingAttachment
) => {
  const attachmentMd5Lookup = await getOrCreateAttachmentMd5Lookup(
    contentsManager,
    listingID
  )

  const content = await blobToBase64String(attachment.data)

  await contentsManager.save(`/${listingID}/${attachment.name}`, {
    content,
    type: 'file',
    format: 'base64',
  })

  // remove from lookup
  attachmentMd5Lookup[attachment.name] = attachment.md5

  // save updated lookup
  await saveAttachmentMd5Lookup(contentsManager, listingID, attachmentMd5Lookup)
}

const ensureAttachmentsExist = async (
  contentsManager: ContentsManager,
  listingID: string,
  attachments: ListingAttachment[]
) => {
  const attachmentMd5Lookup = await getOrCreateAttachmentMd5Lookup(
    contentsManager,
    listingID
  )

  const model = await contentsManager.get(`/${listingID}`)

  const exists = new Set<string>([])

  // delete any files which aren't in attachments
  for (const remoteFile of model.content as Contents.IModel[]) {
    const remoteMd5 = attachmentMd5Lookup[remoteFile.name]

    if (remoteMd5) {
      if (attachments.find(({ md5 }) => md5 === remoteMd5)) {
        // file already exists
        exists.add(remoteFile.name)
        continue
      }
    }

    // file either doesn't exist, or has changed
    if (attachments.find(({ name }) => name === remoteFile.name)) {
      // we're about to replace it anyway, no need to delete now
      continue
    }

    // we're not going to replace this file, and it no longer exists locally
    await deleteAttachment(
      contentsManager,
      listingID,
      remoteFile.name,
      remoteFile.path
    )
  }

  // upload new files which don't exist
  for (const attachment of attachments) {
    if (!exists.has(attachment.name)) {
      await saveAttachment(contentsManager, listingID, attachment)
    }
  }
}

type Kernel = 'julia' | 'python' | 'ir'

const executionHash = (
  listingID: string,
  attachments: ListingAttachment[],
  code: string,
  kernelName: Kernel
): Promise<string> => {
  let msg = ''

  msg += listingID

  msg += code

  msg += kernelName

  // add attachment info
  msg += attachments.reduce((acc, { name, md5 }) => {
    return acc + name + md5
  }, '')

  return sha256(msg)
}

type Kernels = { [key in CodemirrorMode]?: Kernel }

export const kernels: Kernels = {
  julia: 'julia',
  python: 'python',
  r: 'ir',
}

// TODO: use a data structure that drops things after a while
// const sessions: Map<string, Session.ISession> = new Map()

// TODO: callback for handling output stream e.g. stderr
export const executeKernel = async (
  serverConfig: {
    url: string
    token: string
  },
  listingID: string,
  attachments: ListingAttachment[],
  code: string,
  languageKey: CodemirrorMode,
  callback: (message: KernelMessage.IIOPubMessage) => void
) => {
  const kernelName = kernels[languageKey]

  if (!kernelName) {
    throw new Error(`No kernel is available for ${languageKey}`)
  }

  const hash = await executionHash(listingID, attachments, code, kernelName)

  // if (sessions.has(hash)) {
  //   // TODO: cancel the operation?
  //   return
  // }

  const serverSettings = ServerConnection.makeSettings({
    baseUrl: serverConfig.url,
    token: serverConfig.token,
    fetch: (input: RequestInfo, init?: RequestInit) =>
      fetch(input, {
        ...init,
        headers: {
          Authorization: `token ${serverConfig.token}`,
        },
      }),
  })

  const contentsManager = new ContentsManager({ serverSettings })

  await ensureDirectoryExists(contentsManager, listingID)

  await ensureAttachmentsExist(contentsManager, listingID, attachments)

  const session = await Session.startNew({
    kernelName,
    path: `${listingID}/${hash}.ipynb`,
    serverSettings,
  })

  // sessions.set(hash, session)

  const future = session.kernel.requestExecute({ code })

  return new Promise(async resolve => {
    future.onIOPub = callback

    await future.done

    await session.shutdown()

    resolve()
  })
}
