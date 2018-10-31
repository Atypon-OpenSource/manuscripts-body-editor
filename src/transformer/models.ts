import * as Models from '@manuscripts/manuscripts-json-schema'
import { RxAttachment, RxAttachmentCreator } from 'rxdb'
import { ManuscriptNode } from '../schema/types'

// export interface Model extends Models.Model {
//   _deleted?: boolean
//   objectType: string
// }

export interface Attachment {
  id: string
  data: Blob | ArrayBuffer
  type: string
}

export interface Attachments {
  _attachments: Array<RxAttachment<Models.Model>>
}

export interface ModelAttachment {
  attachment?: RxAttachmentCreator
  src?: string
}

export type ModelWithAttachment = Models.Model & ModelAttachment

export interface UserProfileWithAvatar extends Models.UserProfile {
  avatar?: string
}

export interface ContainedProps {
  containerID: string
}

export type ContainedModel = Models.Model & ContainedProps

export interface ManuscriptProps {
  manuscriptID: string
}

export type ManuscriptModel = ContainedModel & ManuscriptProps

export interface AuxiliaryObjectReference extends ContainedModel {
  containingObject: string
  referencedObject: string
  auxiliaryObjectReferenceStyle?: string
}

export interface CommentSelector {
  from: number
  to: number
  text: string
}

export interface CommentAnnotation extends ManuscriptModel {
  contents: string
  selector?: CommentSelector
  target: string
  userID: string
}

export interface PlaceholderElement extends ContainedModel {
  elementType: 'p'
}

export interface Selected {
  pos: number
  node: ManuscriptNode
}
