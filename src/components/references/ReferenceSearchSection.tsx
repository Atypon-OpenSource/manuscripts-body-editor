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
  TriangleCollapsedIcon,
  TriangleExpandedIcon,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  BibliographyItemSearch,
  BibliographyItemSource,
} from './BibliographyItemSource'
import { ReferenceSearchResults } from './ReferenceSearchResults'
import { ReferenceSearchResultsPlaceholder } from './ReferenceSearchResultsPlaceholder'

const SearchSourceLabel = styled.div`
  margin: 0 ${(props) => props.theme.grid.unit * 4}px
    ${(props) => props.theme.grid.unit * 2}px;
  color: ${(props) => props.theme.colors.text.secondary};
  cursor: pointer;

  display: flex;
  align-items: center;

  .icon {
    margin-left: 8px;
    margin-right: 13px;
  }

  &:hover {
    color: ${(props) => props.theme.colors.text.muted};
  }
`

type RunningState = {
  type: 'running'
  promise: BibliographyItemSearch
}

type CompletedState = {
  type: 'completed'
  items: BibliographyItemAttrs[]
  total: number
}

type State = RunningState | CompletedState

export const ReferenceSearchSection: React.FC<{
  query: string
  source: BibliographyItemSource
  isSelected: (item: BibliographyItemAttrs) => boolean
  onSelect: (item: BibliographyItemAttrs) => void
}> = ({ query, source, isSelected, onSelect }) => {
  const [expanded, setExpanded] = useState(true)
  const [state, setState] = useState<State>()
  const [limit, setLimit] = useState(3)

  const toggleExpanded = () => {
    setExpanded((value) => !value)
  }

  useEffect(() => {
    const search = async () => {
      const promise = source.search(query, limit)
      setState((s) => {
        if (s?.type === 'running') {
          s.promise.controller?.abort()
        }
        return {
          type: 'running',
          promise,
        }
      })
      const response = await promise
      if (promise.controller?.signal.aborted) {
        return
      }
      setState({
        type: 'completed',
        ...response,
      })
    }
    search()
  }, [source, query, limit])

  const handleShowMore = () => {
    setLimit(25)
  }

  return (
    <>
      <SearchSourceLabel onClick={toggleExpanded}>
        {expanded ? (
          <TriangleExpandedIcon className={'icon'} />
        ) : (
          <TriangleCollapsedIcon className={'icon'} />
        )}
        {source.label}
      </SearchSourceLabel>

      {expanded && state?.type === 'running' && (
        <ReferenceSearchResultsPlaceholder />
      )}
      {expanded && state?.type === 'completed' && (
        <ReferenceSearchResults
          items={state.items}
          total={state.total}
          isSelected={isSelected}
          onSelect={onSelect}
          onShowMore={handleShowMore}
        />
      )}
    </>
  )
}
