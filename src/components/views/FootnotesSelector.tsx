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

import {
  AddedIcon,
  AddIcon,
  AddNewIcon,
  ButtonGroup,
  IconTextButton,
  PrimaryButton,
  SecondaryButton,
} from '@manuscripts/style-guide'
import { FootnoteNode, InlineFootnoteNode } from '@manuscripts/transform'
import React, { useState } from 'react'
import styled from 'styled-components'

import { FootnoteWithIndex } from '../../lib/footnotes'

const NotesContainer = styled.div`
  height: 90vh;
  max-height: 400px;
  overflow-y: auto;
`

const Actions = styled(ButtonGroup)`
  align-items: center;
  box-shadow: 0 -2px 12px 0 rgba(216, 216, 216, 0.26);
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.grid.unit * 4}px;
`

const Container = styled.div`
  flex: 1;
  font-family: ${(props) => props.theme.font.family.sans};
`

const AddNewFootnote = styled(ButtonGroup)`
  button {
    margin-right: ${(props) => props.theme.grid.unit * 8}px;
  }

  button:hover,
  button:active {
    path {
      stroke: ${(props) => props.theme.colors.brand.medium};
    }
    rect {
      stroke: ${(props) => props.theme.colors.brand.medium};
    }
  }
`

export const FootnotesSelector: React.FC<{
  notes: FootnoteWithIndex[]
  inlineFootnote?: InlineFootnoteNode
  onAdd: () => void
  onInsert: (notes: FootnoteWithIndex[]) => void
  onCancel: () => void
  addNewLabel?: string
}> = ({ notes, inlineFootnote, onAdd, onInsert, onCancel, addNewLabel }) => {
  let selectedNotesMap

  if (inlineFootnote) {
    const rids = inlineFootnote.attrs.rids
    const selectedNotes = notes.filter(({ node }) =>
      rids.includes(node.attrs.id)
    )
    selectedNotesMap = new Map(
      selectedNotes.map(({ node }) => [node.attrs.id, node])
    )
  }

  const [selections, setSelections] = useState(
    new Map<string, FootnoteNode>(selectedNotesMap)
  )

  const toggleSelection = (item: FootnoteNode) => {
    const id = item.attrs.id
    if (selections.has(id)) {
      selections.delete(id)
      setSelections(new Map([...selections]))
    } else {
      selections.set(id, item)
      setSelections(new Map([...selections]))
    }
  }

  const isSelected = (item: FootnoteNode) => {
    return selections.has(item.attrs.id)
  }

  const handleClick = () => {
    return onInsert(notes.filter(({ node }) => selections.has(node.attrs.id)))
  }

  return (
    <Container>
      <NotesContainer>
        <FootnotesList
          notes={notes}
          inlineFootnote={inlineFootnote}
          isSelected={isSelected}
          onSelect={toggleSelection}
        />
      </NotesContainer>
      <Actions>
        <AddNewFootnote>
          <IconTextButton onClick={onAdd}>
            <AddNewIcon />
            {addNewLabel || 'Add new'}
          </IconTextButton>
        </AddNewFootnote>
        <ButtonGroup>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton
            onClick={handleClick}
            disabled={selections.size === 0 && !inlineFootnote}
          >
            {inlineFootnote ? 'Update' : 'Insert'}
          </PrimaryButton>
        </ButtonGroup>
      </Actions>
    </Container>
  )
}

const FootnotesList: React.FC<{
  notes: FootnoteWithIndex[]
  inlineFootnote?: InlineFootnoteNode
  isSelected: (item: FootnoteNode) => boolean
  onSelect: (item: FootnoteNode) => void
}> = ({ notes, isSelected, onSelect, inlineFootnote }) => {
  const selectedNotes: FootnoteWithIndex[] = []
  const remainingNotes: FootnoteWithIndex[] = []

  notes.forEach((note) => {
    const isNoteSelected =
      inlineFootnote && inlineFootnote.attrs.rids.includes(note.node.attrs.id)
    if (isNoteSelected) {
      selectedNotes.push(note)
    } else {
      remainingNotes.push(note)
    }
  })

  return (
    <NotesListContainer>
      {selectedNotes.map((note) => (
        <FootnoteItem
          key={note.node.attrs.id}
          note={note}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      ))}
      {selectedNotes.length > 0 && remainingNotes.length > 0 && <Separator />}
      {remainingNotes.map((note) => (
        <FootnoteItem
          key={note.node.attrs.id}
          note={note}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      ))}
    </NotesListContainer>
  )
}

const FootnoteItem: React.FC<{
  note: FootnoteWithIndex
  isSelected: (item: FootnoteNode) => boolean
  onSelect: (item: FootnoteNode) => void
}> = ({ note, isSelected, onSelect }) => {
  const { node, index } = note
  return (
    <FootnoteItemContainer onClick={() => onSelect(node)}>
      <StatusIcon>
        {isSelected(node) ? (
          <AddedIcon data-cy={'plus-icon-ok'} />
        ) : (
          <AddIcon data-cy={'plus-icon'} />
        )}
      </StatusIcon>
      <NoteText>
        {(index ? index + '. ' : '') + node.firstChild?.textContent}
      </NoteText>
    </FootnoteItemContainer>
  )
}

const Separator = styled.div`
  height: 0;
  border-bottom: 1px solid #e2e2e2;
  margin: 4px 0;
`
const NotesListContainer = styled.div`
  padding: ${(props) => props.theme.grid.unit * 6}px
    ${(props) => props.theme.grid.unit * 5}px;
  flex: 1;
  overflow-y: auto;
`

const FootnoteItemContainer = styled.div`
  cursor: pointer;
  padding: ${(props) => props.theme.grid.unit * 2}px 0;
  display: flex;
`
const StatusIcon = styled.div`
  flex-shrink: 1;
  margin-right: ${(props) => props.theme.grid.unit * 3}px;
  margin-left: ${(props) => props.theme.grid.unit}px;
  height: ${(props) => props.theme.grid.unit * 6}px;
  width: ${(props) => props.theme.grid.unit * 6}px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`
const NoteText = styled.div`
  color: ${(props) => props.theme.colors.text.primary};
  flex: 1;
  font-weight: ${(props) => props.theme.font.weight.normal};
  margin-top: 2px;
`
