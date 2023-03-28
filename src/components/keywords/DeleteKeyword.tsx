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
}> = ({ viewProps }) => {
  const [isDeletingKeyword, setIsDeletingKeyword] = useState<boolean>(false)
  const { node, getPos, view } = viewProps

  const keywords: ManuscriptNode[] = []
  node.content.descendants((descNode) => {
    if (descNode.type === descNode.type.schema.nodes.keyword) {
      keywords.push(descNode)
    }
  })

  const handleClick = (event: Event) => {
    const clickTarget = event.target as HTMLElement
    const deleteIcon = clickTarget.closest('.delete-keyword')

    console.log('event', event)
    if (deleteIcon) {
      console.log(deleteIcon.parentElement)
    }
    console.log(keywords)
    console.log(view.state.doc.resolve(getPos()))
    if (true) {
      handleDelete()
    } else {
      handleCancel()
    }
  }

  const handleCancel = () => {
    setIsDeletingKeyword(false)
  }

  const handleDelete = () => {
    setIsDeletingKeyword(false)
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const actions = {
    primary: {
      action: () => {
        setIsDeletingKeyword(false)
      },
      title: 'OK',
    },
  }

  return (
    <Dialog
      isOpen={isDeletingKeyword}
      actions={actions}
      category={Category.confirmation}
      header={'Keyword already exists'}
      message={`You can’t add this keyword because it already exists. You can add another one.`}
    />
  )
}
