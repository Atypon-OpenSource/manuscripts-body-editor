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
import { Category, Dialog, IconButton } from '@manuscripts/style-guide'
import React, { useState } from 'react'

export interface DeleteKeywordDialogProps {
  keyword: string
  handleDelete: () => void
}

const DeleteIcon: React.FC<React.SVGAttributes<SVGElement>> = () => (
  <svg
    className={'delete-keyword'}
    width="8px"
    height="8px"
    viewBox="0 0 26 26"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g fill="#6E6E6E">
        <rect
          id="Rectangle-23-Copy"
          transform="translate(13.000000, 13.000000) rotate(-45.000000) translate(-13.000000, -13.000000) "
          x="-3"
          y="11"
          width="32"
          height="4"
          rx="2"
        />
        <rect
          id="Rectangle-23-Copy-2"
          transform="translate(13.000000, 13.000000) scale(1, -1) rotate(-45.000000) translate(-13.000000, -13.000000) "
          x="-3"
          y="11"
          width="32"
          height="4"
          rx="2"
        />
      </g>
    </g>
  </svg>
)

export const DeleteKeywordDialog: React.FC<DeleteKeywordDialogProps> = ({
  keyword,
  handleDelete,
}) => {
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <IconButton size={18} onClick={() => setOpen(true)}>
        <DeleteIcon />
      </IconButton>
      <Dialog
        isOpen={isOpen}
        actions={{
          primary: {
            action: () => setOpen(false),
            title: 'Cancel',
          },
          secondary: {
            action: () => {
              setOpen(false)
              handleDelete()
            },
            title: 'Delete',
          },
        }}
        category={Category.confirmation}
        header={'Delete Keyword'}
        message={`Are you sure you want to delete "${keyword}" keyword?
      `}
      />
    </>
  )
}
