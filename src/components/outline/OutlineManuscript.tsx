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

import OutlineIconManuscript from '@manuscripts/assets/react/OutlineIconManuscript'
import { Manuscript, Project, Title } from '@manuscripts/json-schema'
import { parse, schema } from '@manuscripts/title-editor'
import { nodeTitlePlaceholder } from '@manuscripts/transform'
import React from 'react'

import {
  Outline,
  OutlineItem,
  OutlineItemArrow,
  OutlineItemIcon,
  OutlineItemLink,
  OutlineItemLinkText,
  OutlineItemPlaceholder,
  StyledTriangleCollapsed,
} from './Outline'

interface Props {
  project: Project
  manuscript: Manuscript
  title: Title
}

const titleText = (value: string) => {
  const node = parse(value, {
    topNode: schema.nodes.title.create(),
  })

  return node.textContent
}

export const OutlineManuscript: React.FunctionComponent<Props> = ({
  project,
  manuscript,
  title,
}) => (
  <Outline>
    <OutlineItem isSelected={false} depth={0}>
      <OutlineItemLink
        to={`/projects/${project._id}/manuscripts/${manuscript._id}`}
      >
        <OutlineItemArrow>
          <StyledTriangleCollapsed />
        </OutlineItemArrow>

        <OutlineItemIcon>
          <OutlineIconManuscript />
        </OutlineItemIcon>

        <OutlineItemLinkText className={'outline-text-title'}>
          {title.articleTitle ? (
            titleText(title.articleTitle)
          ) : (
            <OutlineItemPlaceholder>
              {nodeTitlePlaceholder(schema.nodes.title)}
            </OutlineItemPlaceholder>
          )}
        </OutlineItemLinkText>
      </OutlineItemLink>
    </OutlineItem>
  </Outline>
)
