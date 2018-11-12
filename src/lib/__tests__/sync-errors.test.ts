import * as SyncErrors from '../sync-errors'

jest.mock('rxdb')
jest.mock('rxdb/plugins/core')

describe('sync state', () => {
  it('is not updated if there are no new errors and no existing errors', async () => {
    // tslint:disable-next-line:no-any
    const atomicUpdate = jest.fn()

    const collection: any = {
      getLocal: () => ({
        atomicUpdate,
        toJSON: () => ({ _id: '_local/foo', _rev: '0-1' }),
      }),
    }

    await SyncErrors.saveSyncState(
      collection,
      [],
      [
        {
          objectType: 'MPParagraphElement',
          _id: 'MPParagraphElement:5BCCEC56-7E77-4BEC-82FA-E884078B5000',
          _rev: '4-fffffff191f8e130f9aceaf01c7ab788',
          sessionID: 'test',
          createdAt: 0,
          updatedAt: 0,
        },
      ]
    )

    expect(atomicUpdate).not.toHaveBeenCalled()
  })

  it('is updated if there are new errors and no existing errors', async () => {
    // tslint:disable-next-line:no-any
    const atomicUpdate = jest.fn()

    const collection: any = {
      getLocal: () => ({
        atomicUpdate,
        toJSON: () => ({ _id: '_local/foo', _rev: '0-1' }),
      }),
    }

    await SyncErrors.saveSyncState(
      collection,
      [
        {
          error: 'forbidden',
          id: 'MPListing',
          message: 'something is broken',
          name: 'foo',
          reason: 'bar',
          rev: '1-2323323',
          status: 401,
        },
      ],
      [
        {
          objectType: 'MPParagraphElement',
          _id: 'MPParagraphElement:5BCCEC56-7E77-4BEC-82FA-E884078B5000',
          _rev: '4-fffffff191f8e130f9aceaf01c7ab788',
          sessionID: 'test',
          createdAt: 0,
          updatedAt: 0,
        },
      ]
    )

    expect(atomicUpdate).toHaveBeenCalled()
  })
})

describe('sync error type', () => {
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
