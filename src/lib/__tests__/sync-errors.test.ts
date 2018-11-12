import * as SyncErrors from '../sync-errors'

jest.mock('rxdb')
jest.mock('rxdb/plugins/core')

describe('sync error', () => {
  it('returns SchemaViolation for forbidden', () => {
    const pouchError: any = {
      error: 'forbidden',
      id: 'MPListing',
    }

    expect(SyncErrors.createSyncError(pouchError).type).toEqual(
      SyncErrors.SyncErrorType.SchemaViolation
    )
  })

  it('returns Unknown for anything else', () => {
    const pouchError: any = {
      error: 'conflict',
      id: 'MPListing',
    }

    expect(SyncErrors.createSyncError(pouchError).type).toEqual(
      SyncErrors.SyncErrorType.Unknown
    )
  })
})
