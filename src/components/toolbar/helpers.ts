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
  CHANGE_STATUS,
  skipTracking,
  trackChangesPluginKey,
  trackCommands,
} from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  isSectionNodeType,
  ManuscriptEditorView, ManuscriptNode,
  ManuscriptNodeType,
  nodeNames,
  schema,
} from '@manuscripts/transform'
import {Fragment, Node } from 'prosemirror-model'
import {EditorState, TextSelection, Transaction} from 'prosemirror-state'
import {hasParentNodeOfType} from 'prosemirror-utils'
import {EditorView} from 'prosemirror-view'

import {Dispatch} from '../../commands'
import {isDeleted} from '../../lib/track-changes-utils'
import {Option} from './type-selector/TypeSelector'
import {selectedSuggestionKey} from "../../plugins/selected-suggestion";

export const optionName = (nodeType: ManuscriptNodeType) => {
  switch (nodeType) {
    case nodeType.schema.nodes.section:
      return 'Heading'

    default:
      return nodeNames.get(nodeType) || nodeType.name
  }
}

export const titleCase = (text: string) =>
  text.replace(/\b([a-z])/g, (match) => match.toUpperCase())

export const findSelectedOption = (options: Option[]): Option | undefined => {
  for (const option of options) {
    if (option.isSelected) {
      return option
    }
  }
}

// Helper function to find the deepest subsection (the last subsection that doesn't have subsections itself)
const getDeepestSubsection = (subsection: Node, position: number): [Node, number] => {
  while (subsection.lastChild && isSectionNodeType(subsection.lastChild.type)) {
    position += subsection.nodeSize - subsection.lastChild.nodeSize
    subsection = subsection.lastChild
  }
  return [subsection, position];
}

const getInsertPos = (
  type: ManuscriptNodeType,
  parent: ManuscriptNode,
  pos: number,
) => {
  let insertPos = pos + parent.nodeSize - 1

  parent.forEach((child, offset) => {
    if (child.type.compatibleContent(type)) {
      insertPos = pos + offset + child.nodeSize
    }
  })

  return insertPos
}

/**
 *  That to make sure beforeSection is not a deleted node from another convert_node change,
 *  if it's deleted will check previous section and update insertPos.
 */
const ignoreDeletedSection = (state: EditorState, beforeSection: number, insertPos: number) => {
  const changes = trackChangesPluginKey.getState(state)?.changeSet.changeTree || []
  // if the beforeSection deleted from another StructuralChange will move the insert to the next previous node
  const beforeDeletedContent = [...changes].reverse().find((c, i) =>
    c.to === beforeSection &&
    c.dataTracked.operation === 'delete' &&
    c.dataTracked.moveNodeId &&
    (changes[i - 1]?.dataTracked.operation !== 'delete')
  )?.from
  if (beforeDeletedContent) {
    insertPos = beforeDeletedContent
  }
  return insertPos;
}

/**
 * When converting again a tracked node as convert
 * - if the selection on the same start point of conversion change will be rejected
 * - or if the selection was on part of the content will use change moveNodeId to create a reference change
 */
const handleConversionOnSameNode = (state: EditorState, dispatch: (tr: Transaction) => void, offset: number = 0) => {
  const selection = selectedSuggestionKey.getState(state)?.suggestion
  const changeSet = trackChangesPluginKey.getState(state)?.changeSet
  if (selection && changeSet) {
    const { groupChanges } = changeSet
    const selectedGroup = selection && groupChanges.find(c => c[0].dataTracked.moveNodeId === selection.moveNodeId)
    const selectedChange = selectedGroup && selectedGroup.find(c => c.from === state.selection.$from.before(state.selection.$from.depth) - offset)
    if (selectedChange && selectedChange.dataTracked.operation === 'change_node') {
      trackCommands.setChangeStatuses(CHANGE_STATUS.rejected, selectedGroup.map(c => c.id))(state, dispatch)
      return true
    } else {
      return selection.moveNodeId
    }
  }
  return undefined
}

// Helper function to replace the deepest subsection with a new subsection
const replaceDeepestSubsection = (
  parentNode: Node,
  newSubsection: Node
): Node => {
  if (!parentNode.lastChild || !isSectionNodeType(parentNode.lastChild.type)) {
    return newSubsection // Replace the deepest subsection when found
  }

  const lastSubsectionIndex = parentNode.content.childCount - 1
  const lastSubsection = parentNode.content.child(lastSubsectionIndex)

  // Recursively replace the deepest subsection
  const updatedSubsection = replaceDeepestSubsection(
    lastSubsection,
    newSubsection
  )

  // Replace the last subsection in the parent with the updated version
  return parentNode.copy(
    parentNode.content.replaceChild(lastSubsectionIndex, updatedSubsection)
  )
}

export const demoteSectionToParagraph = (
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view?: ManuscriptEditorView
) => {
  const {
    doc,
    selection: { $from },
    schema,
    tr,
  } = state
  const { nodes } = schema

  const sectionTitle = $from.node($from.depth)
  const afterSectionTitle = $from.after($from.depth)
  const $afterSectionTitle = doc.resolve(afterSectionTitle)
  const afterSectionTitleOffset = $afterSectionTitle.parentOffset

  const sectionDepth = $from.depth - 1
  const section = $from.node(sectionDepth)
  const beforeSection = $from.before(sectionDepth)
  const afterSection = $from.after(sectionDepth)

  const $beforeSection = doc.resolve(beforeSection)
  const previousNode = $beforeSection.nodeBefore
  const paragraph = nodes.paragraph.create(
    {
      id: generateNodeID(nodes.paragraph),
    },
    sectionTitle.content
  )

  let insertPos = beforeSection
  const sectionContent = section.content.cut(afterSectionTitleOffset);
  if (previousNode && isSectionNodeType(previousNode.type)) {
    const hasSubsections = previousNode.lastChild && isSectionNodeType(previousNode.lastChild.type);
    if (hasSubsections) {
      const [deepestSubsection, position] = getDeepestSubsection(previousNode.lastChild, beforeSection - previousNode.lastChild.nodeSize - 2);
      insertPos = getInsertPos(nodes.paragraph, deepestSubsection, position + 1)
    }
    else {
      insertPos = getInsertPos(nodes.paragraph, previousNode, beforeSection - previousNode.nodeSize + 1)
    }
  }

  const selectedMoveNodeId = handleConversionOnSameNode(state, dispatch, 1)
  if (typeof selectedMoveNodeId === 'string') {
    tr.setMeta('change-node-id', selectedMoveNodeId)
  } else if (selectedMoveNodeId) {
    return
  }

  insertPos = ignoreDeletedSection(state, beforeSection, insertPos)

  tr.insert(insertPos, Fragment.from(paragraph).append(sectionContent))
  tr.delete(tr.mapping.map(beforeSection), tr.mapping.map(afterSection))
  tr.setMeta('change-node', 'paragraph')

  tr.setSelection(
    TextSelection.create(tr.doc, insertPos + sectionTitle.content.size + 1)
  )
  dispatch((tr));
  view && view.focus();
}

export const promoteParagraphToSection = (
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  view?: ManuscriptEditorView
) => {
  const { doc, selection: { $from }, schema, tr } = state
  const { nodes } = schema;
  const paragraph = $from.node($from.depth);
  const beforeParagraph = $from.before($from.depth);
  const $beforeParagraph = doc.resolve(beforeParagraph);
  const beforeParagraphOffset = $beforeParagraph.parentOffset;
  const afterParagraphOffset = beforeParagraphOffset + paragraph.nodeSize;
  const sectionDepth = $from.depth - 1;
  const parentSection = $from.node(sectionDepth);
  const endIndex = $from.indexAfter(sectionDepth);
  let afterParentSection = $from.after(sectionDepth);
  let insertPos = afterParentSection;
  const textContent = paragraph.textContent;

  const sectionTitle = textContent
    ? nodes.section_title.create({}, schema.text(textContent))
    : nodes.section_title.create();
  let sectionContent = Fragment.from(sectionTitle)

  if (parentSection.type.name === 'body') {
    afterParentSection = beforeParagraph + paragraph.nodeSize
    // get position before first section in body, starting from the selection node index
    parentSection.forEach((node, offset, index) => {
      if (node.type !== nodes.section && index > tr.doc.resolve(beforeParagraph).index()) {
        const pos = $from.start($from.depth - 1)
        afterParentSection = pos + offset + node.nodeSize
        sectionContent = sectionContent.append(Fragment.from(node))
      }
    })
    insertPos = afterParentSection
  } else if (endIndex < parentSection.childCount) {
    sectionContent = sectionContent.append(parentSection.content.cut(afterParagraphOffset));
  }
  else {
    sectionContent = sectionContent.append(Fragment.from(paragraph.copy()));
  }

  const selectedMoveNodeId = handleConversionOnSameNode(state, dispatch)
  if (typeof selectedMoveNodeId === 'string') {
    tr.setMeta('change-node-id', selectedMoveNodeId)
  } else if (selectedMoveNodeId) {
     return
  }

  tr.insert(insertPos, nodes.section.create({}, sectionContent))
  tr.delete(beforeParagraph, afterParentSection)
  tr.setMeta('change-node', 'section')

  dispatch(tr)
  view && view.focus()
}

export const isIndentationAllowed =
  (action: string) => (state: EditorState) => {
    const { $from } = state.selection
    const nodeType = $from.node().type

    const allowedNodeTypes = [
      schema.nodes.section_title,
      schema.nodes.paragraph,
    ]
    if (!allowedNodeTypes.includes(nodeType)) {
      return false
    }

    const isInBody = hasParentNodeOfType(schema.nodes.body)(state.selection)
    const isDeletedNode = isDeleted($from.node($from.depth))
    if (!isInBody || isDeletedNode) {
      return false
    }

    // It is not allowed to unindent the top level parent sections, headers and paragraphs
    if (action === 'unindent') {
      const grandparentNode = $from.node($from.depth - 2)
      if (grandparentNode?.type === schema.nodes.body) {
        return false
      }
    }

    if (nodeType === schema.nodes.paragraph) {
      const parentNode = $from.node($from.depth - 1)

      const isIndentNotAllowed = ![
        schema.nodes.section,
        schema.nodes.body,
      ].includes(parentNode?.type)

      const isUnindentNotAllowed = parentNode?.type !== schema.nodes.section

      if (action === 'indent' && isIndentNotAllowed) {
        return false
      }

      if (action === 'unindent' && isUnindentNotAllowed) {
        return false
      }
    }

    return true
  }

export const indentSection =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
    } = state
    const { nodes } = schema

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const afterSection = $from.after(sectionDepth)

    const parentSectionDepth = sectionDepth - 1
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)

    const previousSection =
      startIndex > 0 ? parentSection.child(startIndex - 1) : null
    const isValidContainer = previousSection?.type === nodes.section

    let anchor
    if (!previousSection || !isValidContainer) {
      // No valid previous section, creating new parent section
      const emptyTitle = nodes.section_title.create()
      const newParentSectionContent = Fragment.fromArray([emptyTitle, section])
      const newParentSection = nodes.section.create({}, newParentSectionContent)

      tr.replaceWith(beforeSection, afterSection, newParentSection)

      anchor = beforeSection + 1
    } else {
      // Moving section into previous section as subsection
      const newPreviousSection = previousSection.copy(
        previousSection.content.append(Fragment.from(section))
      )

      const beforePreviousSection = beforeSection - previousSection.nodeSize

      tr.replaceWith(beforePreviousSection, afterSection, newPreviousSection)

      anchor = beforePreviousSection + 1
    }

    tr.setSelection(TextSelection.create(tr.doc, anchor))

    dispatch(skipTracking(tr))
    view && view.focus()
  }

export const indentParagraph =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const { $from } = state.selection
    const { schema, tr } = state

    const beforeParagraph = $from.before($from.depth)
    const sectionDepth = $from.depth - 1
    const parentSection = $from.node(sectionDepth)
    const sectionStart = $from.start(sectionDepth)
    const sectionEnd = $from.end(sectionDepth)

    // Build section content
    const sectionContent = Fragment.from(
      schema.nodes.section_title.create()
    ).append(parentSection.content.cut(beforeParagraph - sectionStart))

    // Create new section
    const newSection = schema.nodes.section.create(
      { id: generateNodeID(schema.nodes.section) },
      sectionContent
    )

    // Replace original paragraph and moved nodes with the new section
    tr.replaceWith(beforeParagraph, sectionEnd, newSection)

    // Set selection inside the title of the new section
    tr.setSelection(TextSelection.create(tr.doc, beforeParagraph + 2))

    dispatch(skipTracking(tr))
    view?.focus()
  }

export const unindentSection =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
    } = state
    const { nodes } = schema
    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const sectionTitle = $from.node($from.depth)

    const $beforeSection = tr.doc.resolve(beforeSection)
    const beforeSectionOffset = $beforeSection.parentOffset
    const afterSectionOffset = beforeSectionOffset + section.nodeSize

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)
    const endIndex = $from.indexAfter(parentSectionDepth)
    const beforeParentSection = $from.before(parentSectionDepth)
    const afterParentSection = $from.after(parentSectionDepth)

    const items = []

    let offset = 0

    if (startIndex > 0) {
      const precedingSection = parentSection.cut(0, beforeSectionOffset)
      items.push(precedingSection)
      offset += precedingSection.nodeSize
    }

    items.push(section)

    if (endIndex < parentSection.childCount) {
      const fragment = Fragment.from(nodes.section_title.create()).append(
        parentSection.content.cut(afterSectionOffset)
      )

      items.push(parentSection.copy(fragment))
    }

    tr.replaceWith(beforeParentSection, afterParentSection, items)

    const anchor = beforeParentSection + offset + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    dispatch(skipTracking(tr))
    view && view.focus()
  }

export const unindentParagraph =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
    } = state

    const paragraphPos = $from.before($from.depth)

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const afterSection = $from.after(sectionDepth)
    const sectionStart = $from.start(sectionDepth)

    const parentSectionDepth = sectionDepth - 1
    const parentSection = $from.node(parentSectionDepth)
    const parentSectionStart = $from.start(parentSectionDepth)
    const parentSectionEnd = $from.end(parentSectionDepth)

    let sectionContent = Fragment.from(schema.nodes.section_title.create())

    sectionContent = sectionContent
      .append(section.content.cut(paragraphPos - sectionStart))
      .append(parentSection.content.cut(afterSection - parentSectionStart))

    const newSection = schema.nodes.section.create(
      { id: generateNodeID(schema.nodes.section) },
      sectionContent
    )

    tr.delete(paragraphPos, parentSectionEnd)
    tr.insert(paragraphPos + 2, newSection)

    tr.setSelection(
      TextSelection.create(tr.doc, tr.mapping.map(paragraphPos) + 4)
    )

    dispatch(skipTracking(tr))
    view?.focus()
  }

const indentationHandlers = {
  section_title: {
    indent: indentSection,
    unindent: unindentSection,
  },
  paragraph: {
    indent: indentParagraph,
    unindent: unindentParagraph,
  },
}

export const changeIndentation =
  (action: 'indent' | 'unindent') =>
  (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const { $from } = state.selection
    const nodeName = $from.node().type.name as 'section_title' | 'paragraph'

    const handler = indentationHandlers[nodeName]?.[action]
    handler()(state, dispatch, view)
  }
