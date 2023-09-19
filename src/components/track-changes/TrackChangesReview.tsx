/*!
 * © 2022 Atypon Systems LLC
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

import TrackChangesReviewIcon from '@manuscripts/assets/react/TrackChangesReviewIcon'
import { ManuscriptNode } from '@manuscripts/transform'
import React, { createElement } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

import { PopperManager } from '../../lib/popper'

const TitleStyled = styled.div`
  padding: 16px;
  font-size: 16px;
  border-bottom: 1px solid #ededed;
`

const ChangesStyled = styled.div`
  padding: 16px;
  font-size: 12px;
`

interface TCReviewProps {
  node: ManuscriptNode
  popper: PopperManager
  target: HTMLSpanElement
}

interface TCRevieItemsProps {
  node: ManuscriptNode
}

const TrackChangesItems: React.FC<TCRevieItemsProps> = ({ node }) => {
  return (
    <>
      <TitleStyled>Changes</TitleStyled>
      <ChangesStyled>
        <div>TO BE IMPLEMENTED:</div>
        <div>CITTC-110 - LEAN-2843</div>
        <br />
        <div>{JSON.stringify(node.attrs)}</div>
      </ChangesStyled>
    </>
  )
}

export const TrackChangesReview: React.FC<TCReviewProps> = ({
  node,
  popper,
  target,
}) => {
  const handleClick = () => {
    const popperContainer = document.createElement('div')
    popperContainer.classList.add('track-changes-review')
    ReactDOM.render(
      createElement(TrackChangesItems, {
        node,
      }),
      popperContainer
    )
    popper.show(target, popperContainer, 'top-end')
  }
  return <TrackChangesReviewIcon width={36} height={36} onClick={handleClick} />
}
