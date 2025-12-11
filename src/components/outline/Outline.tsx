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
  depth: number
}>`
  align-items: center;
  color: ${(props) => props.theme.colors.text.primary};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  font-size: ${(props) =>
    props.depth === 0
      ? props.theme.font.size.large
      : props.theme.font.size.medium};
  line-height: 30px;
  margin-left: -${(props) => props.theme.grid.unit * 10}px;
  margin-right: -${(props) => props.theme.grid.unit * 5}px;
  overflow-x: hidden;
  padding-right: ${(props) => props.theme.grid.unit * 5}px;
  padding-left: ${(props) => 20 + props.depth * 20}px;
  white-space: nowrap;

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }
`

export const OutlineItemArrow = styled.button`
  display: inline-block;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 ${(props) => props.theme.grid.unit}px;
  flex-shrink: 0;
  font-size: ${(props) => props.theme.font.size.normal};

  &:hover use {
    fill: #ccc;
  }

  &:focus {
    outline: none;
  }
`

export const OutlineItemNoArrow = styled.span`
  display: inline-block;
  width: 25px;
  flex-shrink: 0;
`

export const OutlineItemLink = styled(Link)`
  flex: 1;
  display: inline-flex;
  align-items: center;
  overflow-x: hidden;
  color: inherit;
  text-decoration: none;
  height: 100%;
  border-bottom: 1px solid transparent;
  border-top: 1px solid transparent;

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
`

export const Outline = styled.div`
  font-size: ${(props) => props.theme.font.size.medium};
  position: relative;

  & .outline-text-title {
    font-size: ${(props) => props.theme.font.size.large};
  }

  &.dragging {
    opacity: 0.5;
  }

  &.drop-before > ${OutlineItem} > ${OutlineItemLink} {
    border-top-color: ${(props) => props.theme.colors.brand.dark};
  }

  &.drop-after > ${OutlineItem} > ${OutlineItemLink} {
    border-bottom-color: ${(props) => props.theme.colors.brand.dark};
  }

  & .subtree.collapsed {
    display: none;
  }

  & div:has(.supplements, .hero-image, .main-document) .references {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed #ddd;
  }
`

export const OutlineItemPlaceholder = styled.span``
