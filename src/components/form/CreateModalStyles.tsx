/*!
 * © 2025 Atypon Systems LLC
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
import { ModalBody, ScrollableModalContent } from '@manuscripts/style-guide'
import styled from 'styled-components'

export const MODAL_ON_CLOSE_NOTIFY_DELAY_MS = 220

export const StyledModalBody = styled(ModalBody)`
  position: relative;
  height: calc(90vh - 250px);
`

export const FormTitle = styled.h2`
  margin: 0 0 ${(props) => props.theme.grid.unit * 3}px;
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.large};
  font-weight: ${(props) => props.theme.font.weight.semibold};
  line-height: ${(props) => props.theme.font.lineHeight.large};
  color: ${(props) => props.theme.colors.text.primary};
`

export const StyledScrollableModalContent = styled(ScrollableModalContent)`
  padding: 45px 16px 16px;
`
