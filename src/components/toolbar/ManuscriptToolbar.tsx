import { Schema } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import styled from 'styled-components'
import { ManuscriptSchema } from '../..'
import { toolbar } from '../../toolbar'
import { LevelSelector } from './LevelSelector'

const ToolbarItem = styled.div`
  display: inline-flex;
  position: relative;
`

const ToolbarButton = styled.button.attrs({
  type: 'button',
})<{
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

export const ToolbarContainer = styled.div`
  margin: 6px;
  display: flex;
  flex-wrap: wrap;
`

export const ToolbarGroup = styled.div`
  margin-right: 8px;
  margin-bottom: 8px;
  white-space: nowrap;

  & ${ToolbarItem} button {
    margin-right: 0;
  }

  & ${ToolbarItem}:not(:first-of-type) button {
    margin-left: -1px;
  }

  & ${ToolbarItem}:first-of-type button {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  & ${ToolbarItem}:last-of-type button {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`

interface ToolbarButtonConfig<S extends Schema> {
  title: string
  content: React.ReactNode
  active?: (state: EditorState<S>) => boolean
  run: (state: EditorState<S>, dispatch: (tr: Transaction<S>) => void) => void
  enable?: (state: EditorState<S>) => boolean
}

export interface ToolbarConfig<S extends Schema> {
  [key: string]: {
    [key: string]: ToolbarButtonConfig<S>
  }
}

interface Props {
  view: EditorView
}

const Toolbar = <S extends Schema>(): React.FunctionComponent<Props> => ({
  view,
}) => (
  <ToolbarContainer>
    {view && (
      <ToolbarGroup>
        <LevelSelector view={view} />
      </ToolbarGroup>
    )}

    {Object.entries(toolbar).map(([groupKey, toolbarGroup]) => (
      <ToolbarGroup key={groupKey}>
        {Object.entries(toolbarGroup).map(([itemKey, item]) => (
          <ToolbarItem key={itemKey}>
            <ToolbarButton
              title={item.title}
              data-active={item.active && item.active(view.state)}
              disabled={item.enable && !item.enable(view.state)}
              onMouseDown={event => {
                event.preventDefault()
                item.run(view.state, view.dispatch)
              }}
            >
              {item.content}
            </ToolbarButton>
          </ToolbarItem>
        ))}
      </ToolbarGroup>
    ))}
  </ToolbarContainer>
)

export const ManuscriptToolbar = Toolbar<ManuscriptSchema>()
