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
import { Change } from 'prosemirror-changeset'
import React from 'react'
import styled from 'styled-components'

import { trackChangesPluginKey, TrackChangesState } from '../../plugins/track'
import { useTrackChangesContext } from './state/TrackChangesContext'
import { usePluginState } from './state/usePluginState'

interface IProps {
  className?: string
}

export function ChangesList(props: IProps) {
  const { className } = props
  const { store } = useTrackChangesContext()
  const trackChangesState: TrackChangesState = usePluginState(
    trackChangesPluginKey
  )

  function handleRevertChangeClick(idx: number) {
    const change = trackChangesState.changeSet.changes[idx]
    store.revert(change)
  }

  return (
    <List className={className}>
      {trackChangesState?.changeSet.changes.map((c: Change, i: number) => (
        <CommitItem key={i}>
          <TitleWrapper>
            <h4>
              {c.deleted.length > 0
                ? c.inserted.length > 0
                  ? 'Insertion + Deletion'
                  : 'Deletion'
                : 'Insertion'}
            </h4>
            <RevertBtn onClick={() => handleRevertChangeClick(i)}>
              Revert
            </RevertBtn>
          </TitleWrapper>
          <Ranges>
            <span className="msg">fromA: {c.fromA}</span>
            <span className="msg">toA: {c.toA}</span>
            <span className="msg">fromB: {c.fromB}</span>
            <span className="msg">toB: {c.toB}</span>
          </Ranges>
        </CommitItem>
      ))}
    </List>
  )
}

const List = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: 0;
  & > li + li {
    margin-top: 1rem;
  }
`
const CommitItem = styled.li``
const TitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  & > h4 {
    margin: 0;
    margin-right: 1rem;
  }
  & > button {
    margin-right: 0.5rem;
  }
`
const Ranges = styled.div`
  align-items: center;
  display: flex;
  & > .msg {
    margin-right: 1rem;
  }
`
const RevertBtn = styled.button<{ active?: boolean }>`
  background: ${({ active }) => active && 'pink'};
`
