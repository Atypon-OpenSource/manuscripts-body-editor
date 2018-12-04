import { EditorView } from 'prosemirror-view'
import React from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { ToolbarButton } from './Toolbar'

Modal.setAppElement('#root')

export const ToolbarItem = styled.div`
  display: inline-flex;
  position: relative;
`

const StyledButton = styled.button<{
  'data-active'?: boolean
}>`
  background-color: ${props => (props['data-active'] ? '#eee' : '#fff')};
  border: 1px solid #d6d6d6;
  cursor: pointer;
  padding: 2px 12px;
  display: inline-flex;
  align-items: center;
  transition: 0.2s all;

  &:hover {
    background: ${props => (props['data-active'] ? '#eee' : '#f6f6f6')};
    z-index: 2;
  }

  &:active {
    background: #ddd;
  }

  &:disabled {
    opacity: 0.2;
  }
`

interface Props {
  key: string
  item: ToolbarButton
  view: EditorView
}

export const ToolbarItemContainer: React.FunctionComponent<Props> = ({
  view,
  item,
}) => (
  <ToolbarItem>
    <StyledButton
      type={'button'}
      title={item.title}
      data-active={item.active && item.active(view.state)}
      disabled={item.enable && !item.enable(view.state)}
      onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        item.run(view.state, view.dispatch)
      }}
    >
      {item.content}
    </StyledButton>
  </ToolbarItem>
)
