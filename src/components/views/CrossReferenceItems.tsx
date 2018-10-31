import React from 'react'
import styled from 'styled-components'
import { Target } from '../../plugins/objects'

const Container = styled.div`
  padding: 12px 16px;
`

const CrossReferenceItem = styled.div<{ isSelected: boolean }>`
  cursor: pointer;
  padding: 16px 32px;
  transition: background-color 0.1s;
  border: 2px solid ${props => (props.isSelected ? 'yellow' : '#eee')};
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-bottom: 16px;

  &:hover {
    border-color: #6fb7ff;
  }
`

const Label = styled.span`
  font-weight: bold;
`

const Caption = styled.span`
  font-style: italic;
`

interface Props {
  referencedObject: string | null
  targets: Target[]
  handleSelect: (id: string) => void
}

export const CrossReferenceItems: React.SFC<Props> = ({
  handleSelect,
  referencedObject,
  targets,
}) => (
  <Container>
    {targets.length ? (
      targets.map(target => (
        <CrossReferenceItem
          key={target.id}
          isSelected={referencedObject === target.id}
          onMouseDown={() => handleSelect(target.id)}
        >
          <Label>{target.label}:</Label> <Caption>{target.caption}</Caption>
        </CrossReferenceItem>
      ))
    ) : (
      <div>No targets available.</div>
    )}
  </Container>
)
