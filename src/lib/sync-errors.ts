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

import { Model } from '@manuscripts/manuscripts-json-schema'
import { RxCollection } from 'rxdb'

export const SYNC_ERROR_LOCAL_DOC_ID = 'sync-errors'

export interface PouchSyncErrorInfo {
  error: string
  id: string
  message: string
  name: string
  reason: string
  rev: string
  status: number
}

export enum SyncErrorType {
  SchemaViolation = 'SchemaViolation',
  Unknown = 'Unknown',
}

export interface SyncError {
  _id: string
  type: SyncErrorType
  message?: string
}

export type SyncErrors = {
  [componentID: string]: SyncError
} & {
  _id: string
  _rev: string
}

export const getLocalErrorDoc = async (collection: RxCollection<Model>) => {
  let localDoc = await collection.getLocal(SYNC_ERROR_LOCAL_DOC_ID)

  if (!localDoc) {
    localDoc = await collection.insertLocal(SYNC_ERROR_LOCAL_DOC_ID, {})
  }

  return localDoc
}

const errorTypeForInfo = (errorInfo: PouchSyncErrorInfo): SyncErrorType => {
  switch (errorInfo.error) {
    case 'forbidden':
      return SyncErrorType.SchemaViolation
    default:
      return SyncErrorType.Unknown
  }
}

export const createSyncError = (errorInfo: PouchSyncErrorInfo): SyncError => {
  return {
    _id: errorInfo.id,
    type: errorTypeForInfo(errorInfo),
    message: errorInfo.message,
  }
}

export const saveSyncState = async (
  collection: RxCollection<Model>,
  errorInfos: PouchSyncErrorInfo[],
  successDocs: Model[]
) => {
  const localDoc = await getLocalErrorDoc(collection)

  const { _id, _rev, ...rest } = localDoc.toJSON() as SyncErrors

  // No new errors and no existing errors, there is no point updating
  if (!errorInfos.length && !Object.keys(rest).length) {
    return
  }

  // tslint:disable-next-line:no-any
  return localDoc.atomicUpdate((syncErrors: any) => {
    if (errorInfos.length) {
      for (const errorInfo of errorInfos) {
        syncErrors[errorInfo.id] = createSyncError(errorInfo)
      }
    }

    // These docs have successfully synced, remove any errors
    if (successDocs.length) {
      for (const doc of successDocs) {
        if (doc._id in syncErrors) {
          delete syncErrors[doc._id]
        }
      }
    }

    return syncErrors
  })
}

export const attentionIconHtml = () => `
  <svg width="24" height="24">
    <g fill="none" fill-rule="evenodd">
      <circle fill="#E28327" cx="12" cy="18.7" r="1"></circle>
      <rect fill="#E28327" x="11.12" y="7.5" width="1.8" height="9" rx="0.9"></rect>
      <path d="M12.901 1.98l9.41 19.587a1 1 0 0 1-.9 1.433H2.59a1 1 0 0 1-.901-1.433l9.41-19.586a1 1 0 0 1 1.802 0z" stroke="#E28327" stroke-width="1.5"></path>
    </g>
  </svg>
`
