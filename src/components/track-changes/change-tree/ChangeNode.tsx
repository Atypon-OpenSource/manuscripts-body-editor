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

import { Change, ChangeTreeNode } from './types'

interface IProps {
  className?: string
  node: ChangeTreeNode
}

export const ChangeNode = (props: IProps) => {
  const { className = '', node } = props
  function handleChangeClick(change: Change) {
    console.log(change)
  }
  return (
    <>
      <Container className={className} depth={node.depth}>
        <ChangesList>
          {node.changes.map((c: Change, i: number) => (
            <ChangeItem key={i}>
              <span className="msg">{c.msg}</span>
              <span className="msg">{c.type}</span>
              <span className="msg">{c.key}</span>
              <span className="msg">{c.value}</span>
              <ShowBtn onClick={() => handleChangeClick(c)}>Show</ShowBtn>
            </ChangeItem>
          ))}
        </ChangesList>
      </Container>
      {node.children.map((n) => (
        <ChangeNode key={n.id} node={n} />
      ))}
    </>
  )
}

const Container = styled.li<{ depth: number }>`
  padding-left: ${({ depth }) => depth * 8}px;
`
const ChangesList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: 0;
  & > li + li {
    margin-top: 0.5rem;
  }
`
const ChangeItem = styled.li`
  align-items: center;
  display: flex;
  & > .date {
    background: var(--color-primary-lighter);
    border: 4px;
    margin-right: 1rem;
    padding: 0.1rem 0.25rem;
  }
  & > .msg {
    margin-right: 1rem;
  }
`
const ShowBtn = styled.button<{ active?: boolean }>`
  background: ${({ active }) => active && 'pink'};
`
