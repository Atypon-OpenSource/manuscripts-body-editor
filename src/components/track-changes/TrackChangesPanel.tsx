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

import React, { useState } from 'react'
import styled from 'styled-components'

import { ChangeSummary } from './change-tree/ChangeSummary'
import { ChangeTreeNode } from './change-tree/types'
import { ChangesList } from './ChangesList'
import { useTrackChangesContext } from './state/TrackChangesContext'

interface Props {
  onClose: () => void
}

export function TrackChangesPanel(props: Props) {
  const { onClose } = props
  const [showDiff, setShowDiff] = useState(false)
  const [changeTree, setChangeTree] = useState<ChangeTreeNode | null>(null)
  const { store } = useTrackChangesContext()

  function handleClickDiff() {
    setShowDiff(true)
    const diff = store.diff()
    if (diff) {
      setChangeTree(diff)
    }
  }

  return (
    <Wrapper>
      <Container>
        <TopRow>
          <button onClick={() => setShowDiff(false)}>Track</button>
          <button onClick={handleClickDiff}>Diff</button>
          <button onClick={onClose}>Close</button>
        </TopRow>
        {showDiff ? (
          <ChangeSummary changeTree={changeTree} />
        ) : (
          <ChangesList className="changes-list" />
        )}
      </Container>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: fixed;
  width: 0px;
  height: 0px;
  top: 0px;
  left: 0px;
  z-index: 99999999;
`
const Container = styled.div`
  background-color: #fff;
  position: fixed;
  z-index: 1;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 0px 4px 0px;
  overflow: scroll;
  left: 50%;
  top: 0;
  width: 50%;
  height: 100%;
  transition: left 0.2s ease-out 0s, top 0.2s ease-out 0s,
    width 0.2s ease-out 0s, height 0.2s ease-out 0s;

  .changes-list {
    margin: 0 0.5rem;
  }
`
const TopRow = styled.div`
  display: flex;
  padding: 0.5rem;
  & > * + * {
    margin-left: 1rem;
  }
`
