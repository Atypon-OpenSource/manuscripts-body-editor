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
import styled from 'styled-components'

interface Props {
  onClick: () => void
}

export function TrackChangesBtn(props: Props) {
  const { onClick } = props
  return <TrackChangesBtnWrapper onClick={onClick}>Diff</TrackChangesBtnWrapper>
}

const TrackChangesBtnWrapper = styled.button`
  position: fixed;
  top: 16px;
  right: 16px;
  background: #32c20e;
  border-radius: 4px;
  box-shadow: 0 0 30px rgb(0 0 0 / 30%);
  color: white;
  cursor: pointer;
  padding: 0.5rem 1rem;
  -webkit-transition: opacity 0.3s;
  transition: opacity 0.3s;
  z-index: 99999;
`
