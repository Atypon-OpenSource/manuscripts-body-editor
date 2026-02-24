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
  SecondaryButton,
  withListNavigation,
  withNavigableListItem,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useRef } from 'react'
import styled from 'styled-components'

import { ReferenceLine } from './ReferenceLine'

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

const MoreButton = styled(SecondaryButton)`
  font-size: inherit;
  text-transform: none;
  text-decoration: underline;
  border: none;
  margin-left: ${(props) => props.theme.grid.unit * 4}px;
  color: ${(props) => props.theme.colors.button.default.color.default};
`

export const ReferenceSearchResultsContainer = withListNavigation(styled.div`
  padding: ${(props) => props.theme.grid.unit * 2}px
    ${(props) => props.theme.grid.unit * 4}px;
  flex: 1;
  overflow-y: auto;
  outline: none;
`)

export const ReferenceSearchResult = withNavigableListItem(styled.div`
  cursor: pointer;
  padding: ${(props) => props.theme.grid.unit * 2}px 0;
  display: flex;

  &:not(:last-of-type) {
    border-bottom: 1px solid #f6f6f6;
  }
`)

export const ReferenceSearchResults: React.FC<{
  items: BibliographyItemAttrs[]
  total: number
  isSelected: (item: BibliographyItemAttrs) => boolean
  onSelect: (item: BibliographyItemAttrs) => void
  onShowMore: () => void
}> = ({ items, total, isSelected, onSelect, onShowMore }) => {
  const list = useRef<HTMLElement>(null)
  const onExpandReferenceList = () => {
    const element = list.current
    if (element) {
      // this to not lose focus after we expand list
      element.setAttribute('tabindex', '0')
      element.focus()
      element.setAttribute('tabindex', '-1')
    }
    onShowMore()
  }

  return (
    <ReferenceSearchResultsContainer ref={list}>
    {items.map((item) => (
      <ReferenceSearchResult
        onClick={() => onSelect(item)}
        key={item.id}
        data-cy={`${isSelected(item) ? 'selected-reference' : 'reference'}`}
      >
        <StatusIcon>
          {isSelected(item) ? (
            <AddedIcon width={24} height={24} />
          ) : (
            <AddIcon width={24} height={24} />
          )}
        </StatusIcon>
        <ReferenceLine item={item} />
      </ReferenceSearchResult>
    ))}
      {items.length < 25 && total > items.length ? (
        <MoreButton onClick={onExpandReferenceList} data-cy={'more-button'}>
        Show more
      </MoreButton>
    ) : undefined}
    </ReferenceSearchResultsContainer>
  )
}
