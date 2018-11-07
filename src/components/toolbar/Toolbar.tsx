import { Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import React from 'react'
import styled from 'styled-components'
import { ManuscriptEditorState } from '../../schema/types'
import { LevelSelector } from './LevelSelector'
import { ToolbarItem, ToolbarItemContainer } from './ToolbarItemContainer'

const ToolbarContainer = styled.div`
  margin: 6px;
  display: flex;
  flex-wrap: wrap;
`

const ToolbarGroup = styled.div`
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

interface ToolbarProps {
  toolbar: ToolbarButtonMapMap
  view: EditorView
}

interface ToolbarButtonMapMap {
  [key: string]: ToolbarButtonMap
}

export interface ToolbarButtonMap {
  [key: string]: ToolbarButton
}

export interface ToolbarButton {
  title: string
  content: React.ReactNode
  active?: (state: ManuscriptEditorState) => boolean
  run: (
    state: ManuscriptEditorState,
    dispatch: (tr: Transaction) => void
  ) => void
  enable?: (state: ManuscriptEditorState) => boolean
}

export const Toolbar: React.SFC<ToolbarProps> = ({ toolbar, view }) => (
  <ToolbarContainer>
    {view && (
      <ToolbarGroup>
        <LevelSelector view={view} />
      </ToolbarGroup>
    )}

    {Object.entries(toolbar).map(([groupKey, toolbarGroup]) => (
      <ToolbarGroup key={groupKey} className={'toolbar-group'}>
        {Object.entries(toolbarGroup).map(([itemKey, item]) => (
          <ToolbarItemContainer key={itemKey} view={view} item={item} />
        ))}
      </ToolbarGroup>
    ))}
  </ToolbarContainer>
)
