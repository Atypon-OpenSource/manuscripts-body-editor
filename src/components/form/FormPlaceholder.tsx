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
import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow-y: auto;
`

const Placeholder = styled.div`
  margin-bottom: ${(props) => props.theme.grid.unit * 5}px;
`

const Action = styled.div`
  font-size: ${(props) => props.theme.font.size.xlarge};
  font-weight: ${(props) => props.theme.font.weight.medium};
  letter-spacing: -0.5px;
`

const Message = styled.div`
  max-width: 400px;
  font-size: ${(props) => props.theme.font.size.xlarge};
  margin-top: ${(props) => props.theme.grid.unit * 6}px;
  font-weight: ${(props) => props.theme.font.weight.light};
  color: ${(props) => props.theme.colors.text.secondary};
  text-align: center;

  @media (max-width: 850px) {
    margin-right: ${(props) => props.theme.grid.unit * 5}px;
    margin-left: ${(props) => props.theme.grid.unit * 5}px;
    max-width: 350px;
  }
`

interface FormPlaceholderProps {
  type: string
  title: string
  message: string
  placeholderIcon: React.ReactNode
}

export const FormPlaceholder: React.FC<FormPlaceholderProps> = ({
  type,
  title,
  message,
  placeholderIcon,
}) => (
  <Container data-cy={`${type}-details`}>
    <Placeholder>{placeholderIcon}</Placeholder>
    <Action>{title}</Action>
    <Message>{message}</Message>
  </Container>
)
