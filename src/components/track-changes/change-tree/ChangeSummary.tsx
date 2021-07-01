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
import React from 'react'
// import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

// import { useTrackChangesContext } from '../state/TrackChangesContext'
import { ChangeNode } from './ChangeNode'
import { ChangeTreeNode } from './types'

interface Props {
  className?: string
  changeTree: ChangeTreeNode | null
}

export const ChangeSummary = (props: Props) => {
  const { className = '', changeTree } = props
  return (
    <Container className={className}>
      {changeTree && <ChangeNode node={changeTree} />}
    </Container>
  )
}

const Container = styled.ul`
  display: flex;
  flex-direction: column;
  font-size: 13px;
  list-style: none;
  margin: 0 0 1rem 0;
  padding: 0;
  & > li + li {
    margin-top: 0.5rem;
  }
`
