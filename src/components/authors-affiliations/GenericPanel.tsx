/*!
 * © 2026 Atypon Systems LLC
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
  DrawerIcon,
  DrawerItemLabel,
  DrawerItemMeta,
  DrawerItemsList,
  DrawerLabelContainer,
  DrawerListItem,
  IconButton,
  PlusIcon,
} from '@manuscripts/style-guide'
import React, { useMemo } from 'react'
import styled from 'styled-components'

export const ListItems = DrawerItemsList

const Panel = styled.div`
  display: flex;
  flex-direction: column;
`

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 4}px;
`

const PanelTitle = styled.span`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: 18px;
  line-height: 24px;
  letter-spacing: -0.37px;
  color: ${(props) => props.theme.colors.text.secondary};
`

const PanelCreateButton = styled(IconButton)`
  color: #0d79d0;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 1;
  width: auto;
  height: 24px;
  margin-left: auto;
  &:disabled {
    color: #c9c9c9 !important;
    background-color: unset !important;
    border: unset;
  }
  svg {
    margin-right: 4px;
  }
`

const PanelEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: ${(props) => props.theme.grid.unit * 20}px
    ${(props) => props.theme.grid.unit * 4}px;
`

const PanelEmptyIcon = styled.div`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 100%;
    height: 100%;
  }
`

const PanelEmptyText = styled.p`
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  text-align: center;
  letter-spacing: -0.369px;
`

export interface GenericPanelProps {
  title: string
  createLabel: string
  onCreate: () => void
  createDataCy: string
  emptyDataCy: string
  isEmpty: boolean
  emptyIcon: React.ReactNode
  emptyMessage: React.ReactNode
  children: React.ReactNode
}

export const GenericPanel: React.FC<GenericPanelProps> = ({
  title,
  createLabel,
  onCreate,
  createDataCy,
  emptyDataCy,
  isEmpty,
  emptyIcon,
  emptyMessage,
  children,
}) => (
  <Panel>
    <PanelHeader>
      <PanelTitle>{title}</PanelTitle>
      <PanelCreateButton onClick={onCreate} data-cy={createDataCy}>
        <PlusIcon />
        {createLabel}
      </PanelCreateButton>
    </PanelHeader>
    {isEmpty ? (
      <PanelEmpty data-cy={emptyDataCy}>
        <PanelEmptyIcon aria-hidden>{emptyIcon}</PanelEmptyIcon>
        <PanelEmptyText>{emptyMessage}</PanelEmptyText>
      </PanelEmpty>
    ) : (
      children
    )}
  </Panel>
)

export interface ListItemProps {
  selected: boolean
  onClick: () => void
  primary: React.ReactNode
  secondary?: React.ReactNode
}

export const ListItem: React.FC<ListItemProps> = ({
  selected,
  onClick,
  primary,
  secondary,
}) => (
  <DrawerListItem data-cy="item" selected={selected} onClick={onClick}>
    <DrawerIcon>
      {selected ? (
        <AddedIcon width={22} height={22} />
      ) : (
        <AddIcon width={22} height={22} />
      )}
    </DrawerIcon>
    <DrawerLabelContainer>
      <DrawerItemLabel>{primary}</DrawerItemLabel>
      {secondary != null && secondary !== '' ? (
        <DrawerItemMeta>{secondary}</DrawerItemMeta>
      ) : null}
    </DrawerLabelContainer>
  </DrawerListItem>
)

export function useListSelectedIds(
  selectedItems: { id: string }[]
): Set<string> {
  return useMemo(() => new Set(selectedItems.map((x) => x.id)), [selectedItems])
}
