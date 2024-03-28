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
import ContributorDetails from '@manuscripts/assets/react/ContributorDetailsPlaceholder'
import React from 'react'
import styled from 'styled-components'

const OuterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  overflow-y: auto;
`

const InnerContainer = styled.div`
  text-align: center;
  max-width: 480px;
  font-size: ${(props) => props.theme.font.size.xlarge};
  line-height: ${(props) => props.theme.font.lineHeight.large};
`

const Placeholder = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.grid.unit * 5}px;
`

const Action = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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

  @media (max-width: 850px) {
    margin-right: ${(props) => props.theme.grid.unit * 5}px;
    margin-left: ${(props) => props.theme.grid.unit * 5}px;
    max-width: 350px;
  }
`

export const AuthorFormPlaceholder: React.FC = () => (
  <OuterContainer data-cy={'author-details'}>
    <InnerContainer>
      <Placeholder>
        <ContributorDetails />
      </Placeholder>

      <React.Fragment>
        <Action>Author Details</Action>
        <Message>
          Select an author from the list to display their details here.
        </Message>
      </React.Fragment>
    </InnerContainer>
  </OuterContainer>
)
