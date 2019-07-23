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
import TriangleCollapsed from '@manuscripts/assets/react/TriangleCollapsed';
import TriangleExpanded from '@manuscripts/assets/react/TriangleExpanded';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
export const OutlineItemIcon = styled.span `
  display: inline-flex;
  width: 1.2em;
  height: 1.3em;
  justify-content: center;
  align-items: center;
  padding: 2px;
  flex-shrink: 0;
`;
export const OutlineItem = styled.div `
  display: flex;
  align-items: center;
  white-space: nowrap;
  box-sizing: border-box;
  overflow-x: hidden;
  cursor: pointer;
  color: #444;
  background: ${props => (props.isSelected ? '#E4EEF7' : 'transparent')};
  padding-right: 20px;
  padding-left: ${props => 20 + props.depth * 20}px;
  margin-left: -20px;
  margin-right: -20px;
`;
export const Outline = styled.div `
  font-size: 16px;
  position: relative;

  & .outline-text-title {
    font-size: 18px;
  }
`;
export const StyledTriangleCollapsed = styled(TriangleCollapsed) ``;
export const StyledTriangleExpanded = styled(TriangleExpanded) ``;
export const OutlineItemArrow = styled.button `
  display: inline-block;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 6px;
  flex-shrink: 0;
  font-size: 14px;

  &:hover ${StyledTriangleCollapsed} use[fill='#949494'],
  &:hover ${StyledTriangleExpanded} use[fill='#949494'] {
    fill: #ccc;
  }

  &:focus {
    outline: none;
  }
`;
export const OutlineItemNoArrow = styled.span `
  display: inline-block;
  width: 24px;
  flex-shrink: 0;
`;
export const OutlineDropPreview = styled.div `
  width: 100%;
  background: #65a3ff;
  height: 1px;
  position: absolute;
  margin-left: ${props => 30 + props.depth * 20}px;
  z-index: 2;

  &:before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border: 1px solid #65a3ff;
    border-radius: 6px;
    position: absolute;
    top: -3px;
    left: -6px;
  }
`;
export const OutlineItemLink = styled(Link) `
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
`;
export const OutlineItemLinkText = styled.span `
  flex: 1;
  display: inline-block;
  overflow-x: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
`;
export const OutlineItemPlaceholder = styled.span `
  color: #aaa;
`;
