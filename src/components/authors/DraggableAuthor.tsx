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

import {
  Avatar,
  CorrespondingAuthorIcon,
  VerticalEllipsisIcon,
} from '@manuscripts/style-guide'
import React, { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import styled from 'styled-components'

import { authorLabel, ContributorAttrs } from '../../lib/authors'
import { DropSide, getDropSide } from '../../lib/dnd'

const AuthorContainer = styled.div`
  padding: ${(props) => props.theme.grid.unit * 2}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.25s;
  border: 1px solid transparent;
  border-left: 0;
  border-right: 0;

  &:hover,
  &.active {
    background: ${(props) => props.theme.colors.background.fifth};
  }

  &.active {
    border-color: ${(props) => props.theme.colors.border.primary};
  }

  &.dragging {
    visibility: hidden;
  }

  &.drop-before {
    border-top-color: ${(props) => props.theme.colors.brand.dark};
  }

  &.drop-after {
    border-bottom-color: ${(props) => props.theme.colors.brand.dark};
  }
`

const AvatarContainer = styled.div`
  display: inline-flex;
  position: relative;
`

const AuthorBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
`

const AuthorNotes = styled.div`
  position: absolute;
  top: 0;
  right: 0;

  & ${AuthorBadge}:not(:last-child) {
    right: -20%;
  }
`

const AuthorName = styled.div`
  margin-left: 12px;
  flex: 1;
`

const DragHandle = styled(VerticalEllipsisIcon)`
  cursor: move;
`

interface DragItem {
  author: ContributorAttrs
}

interface DraggableAuthorProps {
  author: ContributorAttrs
  isSelected: boolean
  onClick: () => void
  moveAuthor: (from: number, to: number) => void
}

export const DraggableAuthor: React.FC<DraggableAuthorProps> = ({
  author,
  isSelected,
  onClick,
  moveAuthor,
}) => {
  const [dropSide, setDropSide] = useState<DropSide>()
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, dragRef] = useDrag({
    type: 'author',
    item: {
      author,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, dropRef] = useDrop({
    accept: 'author',
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return
      }
      const side = getDropSide(ref.current, monitor)
      setDropSide(side)
    },
    drop: (item: DragItem, monitor) => {
      if (!ref.current) {
        return
      }
      const side = getDropSide(ref.current, monitor)
      const from = item.author.priority as number
      const to = author.priority as number
      const diff = side === 'before' ? -0.5 : 0.5
      moveAuthor(from, to + diff)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  dragRef(dropRef(ref))

  const classes: string[] = []

  if (isDragging) {
    classes.push('dragging')
  }

  if (isOver && dropSide) {
    classes.push(`drop-${dropSide}`)
  }

  if (isSelected) {
    classes.push('active')
  }

  return (
    <AuthorContainer
      ref={ref}
      className={classes.join(' ')}
      onClick={onClick}
      data-cy="author-item"
    >
      <AvatarContainer data-cy="author-avatar">
        <Avatar size={36} color={'#6e6e6e'} />
        <AuthorNotes data-cy="author-notes">
          {author.isCorresponding && (
            <AuthorBadge>
              <CorrespondingAuthorIcon />
            </AuthorBadge>
          )}
        </AuthorNotes>
      </AvatarContainer>
      <AuthorName data-cy="author-name">{authorLabel(author)}</AuthorName>
      {isSelected && <DragHandle />}
    </AuthorContainer>
  )
}
