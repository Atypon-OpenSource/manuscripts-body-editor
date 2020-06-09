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

import { ManuscriptEditorView } from '@manuscripts/manuscript-transform'
import { Schema } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import React from 'react'
import styled from 'styled-components'

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
  background-color: ${(props) =>
    props['data-active'] ? '#eee' : props.theme.colors.background.primary};
  border: 1px solid ${(props) => props.theme.colors.border.secondary};
  cursor: pointer;
  padding: 2px ${(props) => props.theme.grid.unit * 3}px;
  display: inline-flex;
  align-items: center;
  transition: 0.2s all;

  &:hover {
    background: ${(props) =>
      props['data-active'] ? '#eee' : props.theme.colors.background.secondary};
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
  margin: ${(props) => props.theme.grid.unit}px;
  display: flex;
  flex-wrap: wrap;
`

export const ToolbarGroup = styled.div`
  margin-right: ${(props) => props.theme.grid.unit * 2}px;
  margin-bottom: ${(props) => props.theme.grid.unit * 2}px;
  white-space: nowrap;

  & ${ToolbarItem} button {
    margin-right: 0;
  }

  & ${ToolbarItem}:not(:first-of-type) button {
    margin-left: -1px;
  }

  & ${ToolbarItem}:first-of-type button {
    border-top-left-radius: ${(props) => props.theme.grid.radius.small};
    border-bottom-left-radius: ${(props) => props.theme.grid.radius.small};
  }

  & ${ToolbarItem}:last-of-type button {
    border-top-right-radius: ${(props) => props.theme.grid.radius.small};
    border-bottom-right-radius: ${(props) => props.theme.grid.radius.small};
  }
`

export interface ToolbarButtonConfig<S extends Schema> {
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

export const ManuscriptToolbar: React.FunctionComponent<{
  view: ManuscriptEditorView
}> = ({ view }) => (
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
              onMouseDown={(event) => {
                event.preventDefault()
                item.run(view.state, view.dispatch)
                view.focus()
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
