import { Manuscript } from '@manuscripts/manuscripts-json-schema'
import { parse } from '@manuscripts/title-editor'
import React from 'react'
import { ManuscriptEditorView, ManuscriptNode } from '../../schema/types'
import { Selected } from '../../transformer/models'
import { debounceRender } from '../DebounceRender'
import DraggableTree, { buildTree, TreeItem } from './DraggableTree'

interface Props {
  manuscript: Manuscript
  selected: Selected | null
  view: ManuscriptEditorView | null
  doc: ManuscriptNode | null
}

const ManuscriptOutline: React.SFC<Props> = ({
  doc,
  manuscript,
  selected,
  view,
}) => {
  if (!doc || !view) return null

  const { items } = buildTree({ node: doc, pos: 0, index: 0, selected })

  const tree: TreeItem = {
    node: parse(manuscript.title || ''),
    pos: 0,
    endPos: 0,
    index: 0,
    isSelected: !selected,
    items,
  }

  return <DraggableTree tree={tree} view={view} />
}

export const DebouncedManuscriptOutlineContainer = debounceRender<Props>(
  ManuscriptOutline,
  500,
  {
    leading: true,
  }
)
