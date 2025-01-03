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

import {
  AlertMessage,
  AlertMessageType,
  ButtonGroup,
  DialogModalBody,
  MessageContainer,
  PrimaryBoldHeading,
  PrimaryButton,
  SecondaryButton,
  StyledModal,
  TextArea,
} from '@manuscripts/style-guide'
import { ManuscriptEditorState } from '@manuscripts/transform'
import { debounce } from 'lodash'
import { EditorView } from 'prosemirror-view'
import React, { useState } from 'react'
import styled from 'styled-components'

import { Dispatch, insertEmbed } from '../../commands'
import {
  getOEmbedHTML,
  getOEmbedUrl,
} from '../../lib/oembed'
import { allowedHref } from '../../lib/url'
import { getEditorProps } from '../../plugins/editor-props'
import ReactSubView from '../../views/ReactSubView'
import {Open} from "../views/LinkForm";

const Label = styled.label`
  padding-bottom: 4px;
`

const HeaderContainer = styled(PrimaryBoldHeading)`
  font-size: ${(props) => props.theme.font.size.large};
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
`

const DialogContainer = styled(DialogModalBody)`
  min-width: 750px;
`

const PreviewContainer = styled.div`
  display: flex;
  justify-content: center;
  border: 1px solid ${(props) => props.theme.colors.border.field.default};
  border-radius: ${(props) => props.theme.grid.radius.small};
  padding: 6px ${(props) => props.theme.grid.unit * 4}px;
`

export type InsertEmbedDialogProps = {
  state: ManuscriptEditorState
  dispatch?: Dispatch
  operation: 'Insert' | 'Update'
}

export const InsertEmbedDialog: React.FC<InsertEmbedDialogProps> = ({
  state,
  dispatch,
  operation,
}) => {
  const [isOpen, setOpen] = useState(true)
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [type, setType] = useState<string | undefined>(undefined)
  const [oembedHTML, setOEmbedHTML] = useState<string | undefined>(
    undefined
  )

  const action = () => {
    if (operation === 'Insert') {
      insertEmbed(state, dispatch, {
        href: url,
        mimetype: type,
      })
      setOpen(false)
    } else {
      //  TODO:: update embed href (LEAN-4219)
    }
  }

  const debouncedUrlChange = debounce(async (e) => {
    const url = e.target.value.trim()
    const oEmbedUrl = await getOEmbedUrl(url, 368, 217)
    if (oEmbedUrl) {
      const oembedJSON = await getOEmbedHTML(oEmbedUrl, url, setType)
      setOEmbedHTML(oembedJSON)
    }
    setUrl(url)
  }, 500)

  return (
    <StyledModal isOpen={isOpen} onRequestClose={() => setOpen(false)}>
      <DialogContainer>
        <HeaderContainer>{operation} external media</HeaderContainer>

        <MessageContainer>
          <Container>
            <Label htmlFor={'embed-link'}>Media link</Label>
            <TextArea
              id={'embed-link'}
              rows={2}
              cols={2}
              autoFocus={true}
              required={true}
              placeholder={'https://youtube.com/...'}
              onChange={debouncedUrlChange}
            />
          </Container>
          {(oembedHTML && (
            <Container>
              <Label>Preview</Label>
              <PreviewContainer
                dangerouslySetInnerHTML={{ __html: oembedHTML }}
              />
            </Container>
          )) ||
            (url && allowedHref(url) && <NoPreviewMessage url={url} />)}
        </MessageContainer>

        <ButtonGroup>
          <SecondaryButton onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={action} disabled={!(url && allowedHref(url))}>
            {operation}
          </PrimaryButton>
        </ButtonGroup>
      </DialogContainer>
    </StyledModal>
  )
}

const Link = styled(Open)`
   margin: 0;
   top: 24px;
   position: absolute;
`

export const NoPreviewMessage: React.FC<{ url: string }> = ({ url }) => (
  <Container>
    <AlertMessage type={AlertMessageType.info}>
      <pre>
        No Preview Available,{' '}
        <span>
          <Label>Media Link</Label>
          <Link id={'media-link'} href={url} target={'_blank'} rel={'noopener'}/>
        </span>
      </pre>
    </AlertMessage>
  </Container>
)

export const openEmbedDialog = (
  view?: EditorView,
  operation = 'Insert'
) => {
  if (!view) {
    return
  }
  const { state, dispatch } = view

  const dialog = ReactSubView(
    getEditorProps(state),
    InsertEmbedDialog,
    {
      state,
      dispatch,
      operation,
    },
    state.doc,
    () => 0,
    view
  )

  document.body.appendChild(dialog)
}
