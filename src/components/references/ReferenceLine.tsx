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

import { BibliographyItemAttrs } from '@manuscripts/transform'
import React from 'react'
import styled from 'styled-components'

import { metadata } from '../../lib/references'

export const Metadata = styled.div`
  color: ${(props) => props.theme.colors.text.secondary};
  flex: 1;
  font-weight: ${(props) => props.theme.font.weight.light};
  margin-top: ${(props) => props.theme.grid.unit}px;
`

export const MetadataContainer = styled.div`
  position: relative;
  flex: 1;
`

export const ReferenceLine: React.FC<{
  item: BibliographyItemAttrs
  showUncited?: boolean
}> = ({ item, showUncited }) => (
  <MetadataContainer>
    {showUncited && <UncitedBadge>UNCITED</UncitedBadge>}
    <div data-cy={'reference-title'}>
      {item.title || item.literal || 'Untitled'}
    </div>
    <Metadata>{metadata(item)}</Metadata>
  </MetadataContainer>
)

const UncitedBadge = styled.span`
  padding: 1px 6px;
  display: flex;
  margin-bottom: 2px;
  max-width: max-content;
  border-radius: 4px;
  color: #353535;
  background-color: #f7b314;
  font-size: 10px;
  font-weight: 500;
`
