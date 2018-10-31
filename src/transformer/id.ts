import uuid from 'uuid'
import { ManuscriptNodeType } from '../schema/types'
import { nodeTypesMap } from './node-types'
import { ObjectType } from './object-types'

export const generateNodeID = (type: ManuscriptNodeType) => {
  return nodeTypesMap.get(type) + ':' + uuid.v4().toUpperCase()
}

export const generateID = (objectType: ObjectType) => {
  return objectType + ':' + uuid.v4().toUpperCase()
}
