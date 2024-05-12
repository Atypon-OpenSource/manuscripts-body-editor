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
import React from 'react'
import styled from 'styled-components'

import { Metadata, MetadataContainer } from './ReferenceLine'
import {
  ReferenceSearchResult,
  ReferenceSearchResultsContainer,
} from './ReferenceSearchResults'

const IconPlaceholderContainer = styled.div`
  width: 36px;
`

const IconPlaceholder = styled.span`
  margin-left: 8px;
`

const MetadataPlaceholder = styled(Metadata)`
  background: ${(props) => props.theme.colors.text.muted};
  height: 1.2em;
`

const TitlePlaceholder = styled.div`
  background: ${(props) => props.theme.colors.border.primary};
  height: 1.2em;
`

const SearchingLabel = styled.div`
  color: ${(props) => props.theme.colors.text.secondary};
  margin-left: ${(props) => props.theme.grid.unit * 9}px;
`

const ReferenceSearchResultPlaceholder = styled(ReferenceSearchResult)`
  opacity: 0.2;
`

const Placeholder: React.FC = () => (
  <ReferenceSearchResultPlaceholder>
    <IconPlaceholderContainer>
      <IconPlaceholder>...</IconPlaceholder>
    </IconPlaceholderContainer>
    <MetadataContainer>
      <TitlePlaceholder />
      <MetadataPlaceholder />
    </MetadataContainer>
  </ReferenceSearchResultPlaceholder>
)

export const ReferenceSearchResultsPlaceholder: React.FC = () => (
  <ReferenceSearchResultsContainer>
    <SearchingLabel>Searching</SearchingLabel>
    <Placeholder />
    <Placeholder />
    <Placeholder />
  </ReferenceSearchResultsContainer>
)
