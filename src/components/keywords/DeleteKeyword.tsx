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
import { Category, Dialog } from '@manuscripts/style-guide'
import { ManuscriptEditorView, ManuscriptNode } from '@manuscripts/transform'
import React, { useEffect, useState } from 'react'

export const DeleteKeyword: React.FC<{
  viewProps: {
    view: ManuscriptEditorView
    getPos: () => number
    node: ManuscriptNode
  }
  getUpdatedNode: () => ManuscriptNode
}> = ({ viewProps, getUpdatedNode }) => {
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<boolean>(false)
  const [keywordToDelete, setKeywordToDelete] = useState<string>('')
  const [keywordToDeleteId, setKeywordToDeleteId] = useState<string>('')
  const { getPos, view } = viewProps

  const getKeywords = (node: ManuscriptNode) => {
    const keywords: ManuscriptNode[] = []
    node.content.descendants((descNode) => {
      if (descNode.type === descNode.type.schema.nodes.keyword) {
        keywords.push(descNode)
      }
    })
    return keywords
  }

  const handleClick = (event: Event) => {
    const clickTarget = event.target as HTMLElement
    const deleteIcon = clickTarget.closest('.delete-keyword')

    if (deleteIcon) {
      const keywordId = deleteIcon.parentElement?.getAttribute('id') || ''
      const keywordContent = deleteIcon.parentElement?.textContent || ''
      setKeywordToDeleteId(keywordId)
      setKeywordToDelete(keywordContent)
      setIsDeletingKeyword(true)
    }
  }

  const handleCancel = () => {
    resetState()
  }

  const handleDelete = () => {
    if (keywordToDeleteId) {
      const keywords = getKeywords(getUpdatedNode())
      const keywordIndex = keywords.findIndex(
        (element) => element.attrs.id === keywordToDeleteId
      )
      const keywordPosition = keywords.reduce(
        (acc, element, index) =>
          index < keywordIndex ? acc + element.nodeSize : acc,
        0
      )
      const elementSize = keywords[keywordIndex].nodeSize
      const elementPosition = view.state.doc.resolve(
        getPos() + keywordPosition + 1
      )

      view.dispatch(
        view.state.tr.delete(
          elementPosition.pos,
          elementPosition.pos + elementSize
        )
      )
      resetState()
    }
  }

  const resetState = () => {
    setIsDeletingKeyword(false)
    setKeywordToDeleteId('')
    // setKeywordToDelete('')
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const actions = {
    primary: {
      action: handleCancel,
      title: 'Cancel',
    },
    secondary: {
      action: handleDelete,
      title: 'Delete',
    },
  }

  return (
    <Dialog
      isOpen={isDeletingKeyword}
      actions={actions}
      category={Category.confirmation}
      header={'Delete Keyword'}
      message={`Are you sure you want to delete "${keywordToDelete}" keyword?
      `}
    />
  )
}
