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
import { PrimaryButton } from '@manuscripts/style-guide'
import React from 'react'
import styled from 'styled-components'

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 32px;
  height: 40px;
  box-shadow: 0px -2px 12px 0px rgba(216, 216, 216, 0.26);
  border-radius: 0px 0px 8px 8px;
  position: relative;
  z-index: 3;
`

const FormFooter = ({ onCancel }: { onCancel: () => void }) => {
  return (
    <Footer>
      <PrimaryButton onClick={onCancel}>Close</PrimaryButton>
    </Footer>
  )
}

export default FormFooter
