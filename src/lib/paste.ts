import { ManuscriptSlice } from '../schema/types'

const removeFirstParagraphIfEmpty = (slice: ManuscriptSlice) => {
  const firstChild = slice.content.firstChild

  if (
    firstChild &&
    firstChild.type === firstChild.type.schema.nodes.paragraph &&
    firstChild.textContent === ''
  ) {
    slice.content = slice.content.cut(firstChild.nodeSize)
  }
}

// remove `id` from pasted content
const removeIDs = (slice: ManuscriptSlice) => {
  slice.content.descendants(node => {
    if (node.attrs.id) {
      node.attrs.id = null
    }
  })
}

export const transformPasted = (slice: ManuscriptSlice): ManuscriptSlice => {
  removeFirstParagraphIfEmpty(slice)

  removeIDs(slice)

  return slice
}
