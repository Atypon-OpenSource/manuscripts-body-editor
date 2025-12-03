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

import React from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import styled from 'styled-components'

import { ContributorAttrs } from '../../lib/authors'
import { DraggableAuthor } from './DraggableAuthor'

const AuthorListContainer = styled.div`
  flex: 1;
  overflow-y: visible;
`
const AuthorListTitle = styled.h2`
  color: #6e6e6e;
  font-size: 18px;
  font-weight: 400;
  line-height: 24px;
  margin-left: 14px;
  margin-top: 20px;
`

interface AuthorListProps {
  author?: ContributorAttrs
  authors: ContributorAttrs[]
  onSelect: (item: ContributorAttrs) => void
  onDelete: () => void
  moveAuthor: (
    from: ContributorAttrs,
    to: ContributorAttrs,
    shift: number
  ) => void
  lastSavedAuthor: string | null
}

export const AuthorList: React.FC<AuthorListProps> = ({
  author,
  authors,
  onSelect,
  onDelete,
  moveAuthor,
  lastSavedAuthor,
}) => {
  return (
    <DndProvider backend={HTML5Backend} context={window}>
      <AuthorListTitle>Existing Authors</AuthorListTitle>
      <AuthorListContainer data-cy="authors-list">
        {authors.map((a) => {
          return (
            <DraggableAuthor
              key={a.id}
              author={a}
              isSelected={a.id === author?.id}
              onClick={() => onSelect(a)}
              onDelete={() => onDelete()}
              moveAuthor={moveAuthor}
              showSuccessIcon={lastSavedAuthor === a.id}
            />
          )
        })}
      </AuthorListContainer>
    </DndProvider>
  )
}
