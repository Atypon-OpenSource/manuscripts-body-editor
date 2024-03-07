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

import CorrespondingAuthorBadge from '@manuscripts/assets/react/CorrespondingAuthorBadge'
import VerticalEllipsis from '@manuscripts/assets/react/VerticalEllipsis'
import { Avatar } from '@manuscripts/style-guide'
import React, { useRef, useState } from 'react'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import styled from 'styled-components'

import { authorLabel, ContributorAttrs } from '../../lib/authors'

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

const DragHandle = styled(VerticalEllipsis)`
  cursor: move;
`

interface DropPosition {
  id: string
  diff: number
}

const BEFORE = {
  id: 'before',
  diff: -0.5,
}

const AFTER = {
  id: 'after',
  diff: 0.5,
}

const getDropPosition = (element: Element, monitor: DropTargetMonitor) => {
  const rect = element.getBoundingClientRect()

  // Get vertical middle
  const middle = (rect.bottom - rect.top) / 2

  const cursor = monitor.getClientOffset() as XYCoord

  return cursor.y > middle + rect.top ? AFTER : BEFORE
}

interface DragItem {
  type: 'author'
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
  const [dropPosition, setDropPosition] = useState<DropPosition>()
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, dragRef] = useDrag({
    item: {
      type: 'author',
      author,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver }, dropRef] = useDrop({
    accept: 'author',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return
      }
      const position = getDropPosition(ref.current, monitor)
      setDropPosition(position)
    },
    drop: (item: DragItem, monitor) => {
      if (!ref.current) {
        return
      }
      const position = getDropPosition(ref.current, monitor)
      const from = item.author.priority as number
      const to = author.priority as number
      moveAuthor(from, to + position.diff)
    },
  })

  dragRef(dropRef(ref))

  const dragClass = isDragging ? 'dragging' : ''
  const dropClass = isOver && dropPosition ? `drop-${dropPosition.id}` : ''
  const activeClass = isSelected ? 'active' : ''

  return (
    <AuthorContainer
      ref={ref}
      className={`${dragClass} ${dropClass} ${activeClass}`}
      onClick={onClick}
    >
      <AvatarContainer>
        <Avatar size={36} color={'#6e6e6e'} />
        <AuthorNotes>
          {author.isCorresponding && (
            <AuthorBadge>
              <CorrespondingAuthorBadge />
            </AuthorBadge>
          )}
        </AuthorNotes>
      </AvatarContainer>
      <AuthorName>{authorLabel(author)}</AuthorName>
      {isSelected && <DragHandle />}
    </AuthorContainer>
  )
}
