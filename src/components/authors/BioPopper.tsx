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

import { EditIcon, Tooltip } from '@manuscripts/style-guide'
import { Avatar, IconButton, Typography } from '@manuscripts/style-guide/mui'
import React from 'react'
import styled from 'styled-components'

import { authorFullName, ContributorAttrs } from '../../lib/authors'
import { BioValues } from '../../lib/bio'

export interface BioPopperProps {
  author: ContributorAttrs
  bio: BioValues
  image?: string
  onEdit?: () => void
}

export const BioPopper: React.FC<BioPopperProps> = ({
  author,
  bio,
  image,
  onEdit,
}) => {
  const name = authorFullName(author)
  return (
    <Container data-cy="author-bio">
      <Header>
        <Avatar size={48} src={image} name={name} />
        <Title>
          <Typography variant="h3">{name}</Typography>
          {author.isCorresponding && (
            <Typography variant="caption" color="muted">
              Corresponding Author
            </Typography>
          )}
        </Title>
        {onEdit && (
          <>
            <IconButton
              size="small"
              aria-label="Edit"
              data-cy="author-bio-edit"
              data-tooltip-id="author-bio-edit-tooltip"
              data-tooltip-content="Edit"
              onClick={onEdit}
            >
              <EditIcon fill={'currentColor'} />
            </IconButton>
            <Tooltip id="author-bio-edit-tooltip" place="bottom" />
          </>
        )}
      </Header>
      {bio.text && (
        <Text>
          <Typography variant="body">{bio.text}</Typography>
        </Text>
      )}
    </Container>
  )
}

const Container = styled.div`
  box-sizing: border-box;
  width: 340px;
  max-width: 90vw;
  padding: ${(props) => props.theme.grid.unit * 4}px;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.grid.unit * 3}px;
`

const Title = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  align-self: center;
`

const Text = styled.div`
  margin-top: ${(props) => props.theme.grid.unit * 3}px;
  white-space: pre-line;
  overflow-wrap: anywhere;
`
