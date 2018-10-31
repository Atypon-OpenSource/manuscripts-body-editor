import OutlineIconManuscript from '@manuscripts/assets/react/OutlineIconManuscript'
import { Manuscript, Project } from '@manuscripts/manuscripts-json-schema'
import { parse, schema } from '@manuscripts/title-editor'
import React from 'react'
import { nodeTitlePlaceholder } from '../../transformer/node-title'
import {
  Outline,
  OutlineItem,
  OutlineItemArrow,
  OutlineItemIcon,
  OutlineItemLink,
  OutlineItemLinkText,
  OutlineItemPlaceholder,
} from './Outline'

interface Props {
  project: Project
  manuscript: Manuscript
}

const titleText = (value: string) => {
  const node = parse(value, {
    topNode: schema.nodes.title.create(),
  })

  return node.textContent
}

export const OutlineManuscript: React.SFC<Props> = ({
  project,
  manuscript,
}) => (
  <Outline>
    <OutlineItem isSelected={false}>
      <OutlineItemLink
        to={`/projects/${project._id}/manuscripts/${manuscript._id}`}
      >
        <OutlineItemArrow>▶</OutlineItemArrow>

        <OutlineItemIcon>
          <OutlineIconManuscript />
        </OutlineItemIcon>

        <OutlineItemLinkText className={'outline-text-doc'}>
          {manuscript.title ? (
            titleText(manuscript.title)
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
