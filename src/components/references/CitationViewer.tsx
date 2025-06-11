/*!
 * © 2024 Atypon Systems LLC
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
import React, { useMemo } from 'react'
import styled from 'styled-components'

import { ReferenceLine } from './ReferenceLine'

export const CitedItems = styled.div`
  padding: 0 ${(props) => props.theme.grid.unit * 4}px;
  font-family: ${(props) => props.theme.font.family.sans};
  max-height: 70vh;
  min-height: 100px;
  overflow-y: auto;
`

export const CitedItem = styled.div`
  display: flex;
  padding: ${(props) => props.theme.grid.unit * 4}px 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${(props) => props.theme.colors.border.secondary};
  }
`

export interface CitationViewerProps {
  rids: string[]
  items: BibliographyItemAttrs[]
}

export const CitationViewer: React.FC<CitationViewerProps> = ({
  rids,
  items,
}) => {
  const cited = useMemo(() => {
    return rids.flatMap((rid) => items.filter((i) => i.id === rid))
  }, [rids, items])

  return (
    <CitedItems>
      {cited.map((item) => (
        <CitedItem key={item.id}>
          <ReferenceLine item={item} />
        </CitedItem>
      ))}
    </CitedItems>
  )
}
