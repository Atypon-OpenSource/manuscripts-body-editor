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
  CrclTickAnimation,
  DeleteIcon,
  DraggableIcon,
  Tooltip,
} from '@manuscripts/style-guide'
import React, { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import styled from 'styled-components'

import { authorLabel, ContributorAttrs } from '../../lib/authors'
import { DropSide, getDropSide } from '../../lib/dnd'

const AuthorContainer = styled.div`
  padding: ${(props) => props.theme.grid.unit * 2}px 0
    ${(props) => props.theme.grid.unit * 2}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.25s;
  border: 1px solid transparent;
  border-left: 0;
  border-right: 0;
  cursor: pointer;
  &:hover,
  &.active {
    background: ${(props) => props.theme.colors.background.fifth};
    border-color: ${(props) => props.theme.colors.border.primary};
  }
  &.active {
    pointer-events: none;
  }
  &.dragging {
    opacity: 1;
    cursor: grabbing;
  }

  &.dragging * {
    opacity: 0;
  }

  &.drop-before {
    cursor: grabbing;
    border-top-color: ${(props) => props.theme.colors.brand.dark};
  }

  &.drop-after {
    cursor: grabbing;
    border-bottom-color: ${(props) => props.theme.colors.brand.dark};
  }
`

const AvatarContainer = styled.div`
  display: inline-flex;
  position: relative;
  align-items: center;
`

const Box = styled.div`
  margin-left: 14px;
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

const DragHandle = styled(DraggableIcon)`
  cursor: move;
  margin-left: -4px;
  margin-right: -12px;
`
const RemoveButton = styled.div`
  display: flex;
  align-items: center;
  margin-right: 8px;
  svg {
    cursor: pointer;
  }
  .icon_element {
    fill: #6e6e6e;
  }
`
const StyledCrclTickAnimation = styled(CrclTickAnimation)`
  margin-left: 12px;
`
interface DragItem {
  author: ContributorAttrs
}

interface DraggableAuthorProps {
  author: ContributorAttrs
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  moveAuthor: (
    from: ContributorAttrs,
    to: ContributorAttrs,
    shift: number
  ) => void
  showSuccessIcon?: boolean
}

export const DraggableAuthor: React.FC<DraggableAuthorProps> = React.memo(
  ({ author, isSelected, onClick, onDelete, moveAuthor, showSuccessIcon }) => {
    const [dropSide, setDropSide] = useState<DropSide>()
    const ref = useRef<HTMLDivElement>(null)
    const [{ isDragging }, dragRef, preview] = useDrag({
      type: 'author',
      item: {
        author,
      },
      collect: (monitor) => {
        return {
          isDragging: monitor.isDragging(),
        }
      },
    })
    preview(ref)
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
        const diff = side === 'before' ? -0.5 : 0.5
        moveAuthor(item.author, author, diff)
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
      if (ref.current) {
        ref.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }

    return (
      <AuthorContainer
        ref={ref}
        className={classes.join(' ')}
        onClick={onClick}
        data-cy="author-item"
      >
        <AvatarContainer data-cy="author-avatar">
          {isSelected && <DragHandle />}
          <Box>
            {showSuccessIcon && <StyledCrclTickAnimation size={36} />}
            <Avatar
              size={36}
              color={'#6e6e6e'}
              opacity={showSuccessIcon ? 0.05 : 1}
            />
          </Box>
          <AuthorNotes data-cy="author-notes">
            {author.isCorresponding && (
              <AuthorBadge>
                <CorrespondingAuthorIcon />
              </AuthorBadge>
            )}
          </AuthorNotes>
        </AvatarContainer>
        <AuthorName data-cy="author-name">{authorLabel(author)}</AuthorName>
        {isSelected && (
          <RemoveButton
            onClick={() => onDelete()}
            data-tooltip-id={'delete-button-tooltip'}
          >
            <DeleteIcon fill={'#6E6E6E'} />
            <Tooltip id={'delete-button-tooltip'} place="bottom">
              {'Delete'}
            </Tooltip>
          </RemoveButton>
        )}
      </AuthorContainer>
    )
  }
)
