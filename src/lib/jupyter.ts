import {
  Contents,
  ContentsManager,
  ServerConnection,
  Session,
} from '@jupyterlab/services'
import { base64StringToBlob, blobToBase64String } from 'blob-util'
import { sha256 } from 'crypto-hash'

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

const saveAttachmentMd5Lookup = (
  contentsManager: ContentsManager,
  listingID: string,
  lookup: RemoteAttachmentLookup
): Promise<RemoteAttachmentLookup> => {
  return contentsManager
    .save(remoteAttachmentLookupDocumentKey(listingID), {
      content: JSON.stringify(lookup),
      type: 'file',
      format: 'text',
    })
    .then(model => model.content)
}

const getOrCreateAttachmentMd5Lookup = (
  contentsManager: ContentsManager,
  listingID: string
): Promise<RemoteAttachmentLookup> => {
  return contentsManager
    .get(remoteAttachmentLookupDocumentKey(listingID), { content: true })
    .then(model => JSON.parse(model.content))
    .catch(() => {
      // TODO: check this is 404
      return saveAttachmentMd5Lookup(contentsManager, listingID, {})
    })
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

  // get list of all files in the directory
  const remoteFiles: Contents.IModel[] = await contentsManager
    .get(`/${listingID}`)
    .then(model => model.content)

  const exists = new Set<string>([])

  // delete any files which aren't in attachments
  for (const remoteFile of remoteFiles) {
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

const KERNELS = {
  python: 'python',
  r: 'ir',
}

const executionHash = (
  listingID: string,
  attachments: ListingAttachment[],
  code: string,
  kernelName: string = KERNELS.python
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

interface ExecuteResult {
  blob: Blob
  hash: string
}

// TODO: use a data structure that drops things after a while
const existingOperations: Map<string, Promise<ExecuteResult>> = new Map([])

export const executeKernel = async (
  listingID: string,
  attachments: ListingAttachment[],
  code: string,
  kernelName: string = KERNELS.python
): Promise<ExecuteResult> => {
  const hash = await executionHash(listingID, attachments, code, kernelName)

  if (existingOperations.has(hash)) {
    return existingOperations.get(hash)!
  }

  const serverSettings = ServerConnection.makeSettings({
    baseUrl: 'http://0.0.0.0:8888',
    token: '14ae263a426f307d940c9a145114eb7b43ce1402d9717722',
  })

  const contentsManager = new ContentsManager({ serverSettings })

  const promise: Promise<ExecuteResult> = new Promise(
    async (resolve, reject) => {
      await ensureDirectoryExists(contentsManager, listingID)

      await ensureAttachmentsExist(contentsManager, listingID, attachments)

      const options = {
        kernelName,
        path: `${listingID}/${hash}.ipynb`,
        serverSettings,
      }

      Session.startNew(options)
        .then(session => {
          const future = session.kernel.requestExecute({ code })

          future.onIOPub = msg => {
            if (msg.content && msg.content.data) {
              const { data }: any = msg.content
              const contentType = 'image/png'
              if (contentType in data) {
                future.done.then(() => {
                  session.shutdown().then(() => {
                    const blob = base64StringToBlob(
                      data[contentType],
                      contentType
                    )
                    resolve({ blob, hash })
                  })
                })
              }
            }
          }
        })
        .catch(err => {
          reject(err)
        })
    }
  )

  existingOperations.set(hash, promise)

  return promise
}
