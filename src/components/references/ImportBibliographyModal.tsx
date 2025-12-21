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
import {
  CloseButton,
  ModalContainer,
  ModalHeader,
  StyledModal, Tooltip,
} from '@manuscripts/style-guide'
import { BibliographyItemAttrs } from '@manuscripts/transform'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ImportBibliographyForm } from './ImportBibliographyForm'
export interface ImportBibliographyModalProps {
  onCancel: () => void
  onSave: (data: BibliographyItemAttrs[]) => void
}

const exampleBibtex = `@book{abramowitz+stegun,
 author    = "Milton {Abramowitz} and Irene A. {Stegun}",
 title     = "Handbook of Mathematical Functions with Formulas, Graphs, and Mathematical Tables",
 publisher = "Dover",
 year      =  1964,
 address   = "New York City",
 edition   = "ninth Dover printing, tenth GPO printing"
}`

const examplePubmed = `Example Identifiers:
pmid:17170128
PMC1852221`

const exampleRis = `TY  - JOUR
AU  - Shannon, Claude E.
PY  - 1948
DA  - July
TI  - A Mathematical Theory of Communication
T2  - Bell System Technical Journal
SP  - 379
EP  - 423
VL  - 27
ER  - `

const exampleEnw = `%0 Journal Article
%D 2018
%@ 0903-4641
%A Abbassi-Daloii, Tooba
%A Yousefi, Soheil
%A Sekhavati, Mohammad Hadi
%A Tahmoorespur, Mojtaba
%J APMIS
%N 1
%P 65-75
%T Impact of heat shock protein 60KD in combination with outer membrane proteins on immune response against Brucella melitensis
%R https://doi.org/10.1111/apm.12778
%U https://onlinelibrary.wiley.com/doi/abs/10.1111/apm.12778
%V 126
%X Lorem ipsum dolor sit amet`

const exampleDoi = `Example DOI Identifiers:
10.1080/15588742.2015.1017684
http://dx.doi.org/10.1080/15588742.2015.1017684`

export const ImportBibliographyModal: React.FC<
  ImportBibliographyModalProps
> = ({ onCancel, onSave }) => {
  const [isOpen, setOpen] = useState(true)

  const handleCancel = () => {
    handleClose()
  }
  const handleClose = () => setOpen(false)

  const handleSave = (data: BibliographyItemAttrs[]) => {
    onSave(data)
    handleClose()
  }

  return (
    <StyledModal isOpen={isOpen} onRequestClose={onCancel}>
      <ModalContainer data-cy="import-bibliography-modal">
        <ModalHeader>
          <CloseButton onClick={onCancel} data-cy="modal-close-button" />
        </ModalHeader>
        <ModalBody>
          <ModalTitle>Import Bibliography</ModalTitle>
          <p>
            <SpanWithExample
              data-tooltip-id="import-example-tooltip"
              data-tooltip-content={exampleBibtex}
              data-tool
            >
              BibTex
            </SpanWithExample>
            ,{' '}
            <SpanWithExample data-tooltip-id="import-example-tooltip" data-tooltip-content={examplePubmed}>
              PubMed
            </SpanWithExample>
            ,{' '}
            <SpanWithExample data-tooltip-id="import-example-tooltip" data-tooltip-content={exampleRis}>RIS</SpanWithExample>
            ,{' '}
            <SpanWithExample data-tooltip-id="import-example-tooltip" data-tooltip-content={exampleEnw}>ENW</SpanWithExample>{' '}
            and{' '}
            <SpanWithExample data-tooltip-id="import-example-tooltip" data-tooltip-content={exampleDoi}>DOI</SpanWithExample>{' '}
            formats are supported
          </p>
          <ImportBibliographyForm onCancel={handleCancel} onSave={handleSave} />
          <Example id="import-example-tooltip" place="bottom" render={(s) => (<pre>{s.content}</pre>)} />
        </ModalBody>
      </ModalContainer>
    </StyledModal>
  )
}

const ModalBody = styled.div`
  box-sizing: border-box;
  padding: ${(props) => 6 * props.theme.grid.unit}px;
  background-color: ${(props) => props.theme.colors.background.primary};
  width: 640px;
  max-width: 60vw;
  max-height: 80vh;
`
const ModalTitle = styled.h2`
  font-family: ${(props) => props.theme.font.family.sans};
  font-size: ${(props) => props.theme.font.size.medium};
  font-weight: ${(props) => props.theme.font.weight.bold};
  color: ${(props) => props.theme.colors.text.primary};
  margin: 0;
`
const SpanWithExample = styled.span`
  text-decoration: underline dotted;
  text-underline-offset: 4px;
`
const Example = styled(Tooltip)`
  text-align: left !important;
  max-width: 480px !important;
  overflow: hidden !important;
`
