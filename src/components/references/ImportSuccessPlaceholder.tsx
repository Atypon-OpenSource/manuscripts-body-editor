/*!
 * © 2026 Atypon Systems LLC
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

export interface ImportSuccessPlaceholderProps {
  count: number
}

export const ImportSuccessPlaceholder: React.FC<
  ImportSuccessPlaceholderProps
> = ({ count }) => {
  const countLabel = count === 1 ? 'reference' : 'references'

  return (
    <Container data-cy="import-success-placeholder">
      <IconCircle>
        <SuccessCheckIcon />
      </IconCircle>
      <Title>Successfully Imported</Title>
      <Message>
        Your library has been updated with {count} new {countLabel}.
      </Message>
    </Container>
  )
}

const SuccessCheckIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M26.6656 8L12.0004 22.6656L5.3344 15.9994"
      stroke="#36B260"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
)

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.grid.unit * 4}px;
  height: 100%;
  padding: 40px;
  box-sizing: border-box;
  text-align: center;
`

const IconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: #f6ffed;
`

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: -0.37px;
  color: ${(props) => props.theme.colors.text.primary};
`

const Message = styled.p`
  margin: 0;
  line-height: ${(props) => props.theme.font.lineHeight.large};
  color: ${(props) => props.theme.colors.text.secondary};
`
