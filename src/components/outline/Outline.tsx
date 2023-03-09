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

import TriangleCollapsed from '@manuscripts/assets/react/TriangleCollapsed'
import TriangleExpanded from '@manuscripts/assets/react/TriangleExpanded'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const OutlineItemIcon = styled.span`
  display: inline-flex;
  width: 1.2em;
  height: 1.3em;
  justify-content: center;
  align-items: center;
  padding: 2px;
  flex-shrink: 0;
`

export const OutlineItem = styled.div<{
  isSelected: boolean
  depth: number
}>`
  align-items: center;
  border-bottom: 1px solid transparent;
  border-top: 1px solid transparent;
  background: ${(props) =>
    props.isSelected ? props.theme.colors.background.fifth : 'transparent'};
  border-color: ${(props) =>
    props.isSelected
      ? props.theme.colors.border.primary
      : props.theme.colors.background.fifth};
  color: ${(props) => props.theme.colors.text.primary};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  font-size: ${(props) =>
    props.depth === 0
      ? props.theme.font.size.large
      : props.theme.font.size.medium};
  line-height: 30px;
  margin-left: -${(props) => props.theme.grid.unit * 5}px;
  margin-right: -${(props) => props.theme.grid.unit * 5}px;
  overflow-x: hidden;
  padding-right: ${(props) => props.theme.grid.unit * 5}px;
  padding-left: ${(props) => 20 + props.depth * 20}px;
  white-space: nowrap;

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }
`

export const Outline = styled.div`
  font-size: ${(props) => props.theme.font.size.medium};
  position: relative;

  & .outline-text-title {
    font-size: ${(props) => props.theme.font.size.large};
  }
`

export const StyledTriangleCollapsed = styled(TriangleCollapsed)``
export const StyledTriangleExpanded = styled(TriangleExpanded)``

export const OutlineItemArrow = styled.button`
  display: inline-block;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 ${(props) => props.theme.grid.unit}px;
  flex-shrink: 0;
  font-size: ${(props) => props.theme.font.size.normal};

  &:hover ${StyledTriangleCollapsed} use[fill='#949494'],
  &:hover ${StyledTriangleExpanded} use[fill='#949494'] {
    fill: #ccc;
  }

  &:focus {
    outline: none;
  }
`

export const OutlineItemNoArrow = styled.span`
  display: inline-block;
  width: ${(props) => props.theme.grid.unit * 5}px;
  flex-shrink: 0;
`

export const OutlineDropPreview = styled.div<{ depth: number }>`
  width: 100%;
  background: #65a3ff;
  height: 1px;
  position: absolute;
  margin-left: ${(props) => 30 + props.depth * 20}px;
  z-index: 2;

  &:before {
    content: '';
    display: inline-block;
    width: ${(props) => props.theme.grid.unit}px;
    height: ${(props) => props.theme.grid.unit}px;
    border: 1px solid ${(props) => props.theme.colors.brand.default}
    border-radius: ${(props) => props.theme.grid.radius.small};
    position: absolute;
    top: -${(props) => props.theme.grid.unit}px;
    left: -6px;
  }
`

export const OutlineItemLink = styled(Link)`
  flex: 1;
  display: inline-flex;
  align-items: center;
  overflow-x: hidden;
  color: inherit;
  text-decoration: none;
  height: 100%;

  &:focus,
  &:active {
    outline: none;
  }
`

export const OutlineItemLinkText = styled.span`
  flex: 1;
  display: inline-block;
  overflow-x: hidden;
  text-overflow: ellipsis;
  margin-left: ${(props) => props.theme.grid.unit * 2}px;

  &.deleted {
    text-decoration: line-through;
  }
`

export const OutlineItemPlaceholder = styled.span``
