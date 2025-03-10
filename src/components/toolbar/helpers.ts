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
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  isSectionNodeType,
  ManuscriptEditorView,
  ManuscriptNodeType,
  nodeNames,
  schema,
  SectionTitleNode,
} from '@manuscripts/transform'
import { Fragment, Node } from 'prosemirror-model'
import { EditorState, TextSelection, Transaction } from 'prosemirror-state'
import { hasParentNodeOfType } from 'prosemirror-utils'
import { EditorView } from 'prosemirror-view'

import { Dispatch } from '../../commands'
import { isDeleted } from '../../lib/track-changes-utils'
import { Option } from './type-selector/TypeSelector'

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
const getDeepestSubsection = (subsection: Node) => {
  while (subsection.lastChild && isSectionNodeType(subsection.lastChild.type)) {
    subsection = subsection.lastChild
  }
  return subsection
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

  let anchor
  let fragment

  const sectionContent = section.content.cut(afterSectionTitleOffset)

  if (previousNode && isSectionNodeType(previousNode.type)) {
    const hasSubsections =
      previousNode.lastChild && isSectionNodeType(previousNode.lastChild.type)

    if (hasSubsections) {
      const deepestSubsection = getDeepestSubsection(previousNode.lastChild)

      const updatedDeepestSubsection = deepestSubsection.copy(
        deepestSubsection.content
          .append(Fragment.from(paragraph)) // Append the paragraph
          .append(sectionContent) // Append the remaining content
      )

      const updatedPreviousNode = replaceDeepestSubsection(
        previousNode,
        updatedDeepestSubsection
      )
      fragment = updatedPreviousNode.content
    } else {
      // If no subsections exist, just append to the main section
      fragment = Fragment.from(previousNode.content)
        .append(Fragment.from(paragraph))
        .append(sectionContent)
    }

    tr.replaceWith(
      beforeSection - previousNode.nodeSize,
      afterSection,
      previousNode.copy(fragment)
    )

    anchor = beforeSection
  } else {
    tr.replaceWith(
      beforeSection,
      afterSection,
      Fragment.from(paragraph).append(sectionContent)
    )

    anchor = beforeSection + 1
  }

  tr.setSelection(
    TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size)
  )

  dispatch(skipTracking(tr))
  view && view.focus()
}

export const promoteParagraphToSection = (
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
  const paragraph = $from.node($from.depth)
  const beforeParagraph = $from.before($from.depth)
  const $beforeParagraph = doc.resolve(beforeParagraph)
  const beforeParagraphOffset = $beforeParagraph.parentOffset
  const afterParagraphOffset = beforeParagraphOffset + paragraph.nodeSize

  const sectionDepth = $from.depth - 1
  const parentSection = $from.node(sectionDepth)
  const startIndex = $from.index(sectionDepth)
  const endIndex = $from.indexAfter(sectionDepth)
  const beforeParentSection = $from.before(sectionDepth)
  const afterParentSection = $from.after(sectionDepth)

  const items: Node[] = []
  let offset = 0

  if (startIndex > 0) {
    // add the original section with content up to the paragraph
    const precedingSection = parentSection.cut(0, beforeParagraphOffset)
    items.push(precedingSection)
    offset += precedingSection.nodeSize
  }

  const textContent = paragraph.textContent

  const sectionTitle: SectionTitleNode = textContent
    ? nodes.section_title.create({}, schema.text(textContent))
    : nodes.section_title.create()

  let sectionContent = Fragment.from(sectionTitle)
  if (endIndex < parentSection.childCount) {
    sectionContent = sectionContent.append(
      parentSection.content.cut(afterParagraphOffset)
    )
  } else {
    sectionContent = sectionContent.append(Fragment.from(paragraph.copy()))
  }

  if (parentSection.type.name === 'body') {
    const newSection = nodes.section.create({}, sectionContent)
    items[0] = nodes.body.create(
      {},
      items[0]
        ? items[0].content.append(Fragment.from(newSection))
        : Fragment.from(newSection)
    )
  } else {
    items.push(parentSection.copy(sectionContent))
  }

  tr.replaceWith(beforeParentSection, afterParentSection, items)
  const anchor = beforeParentSection + offset + 2

  tr.setSelection(
    TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
  )

  dispatch(skipTracking(tr))
  view && view.focus()
}

export const isIndentationAllowed =
  (action: string) => (state: EditorState) => {
    const { $from } = state.selection
    const nodeType = $from.node().type

    // TODO: Remove condition once unindent section is merged
    const allowedNodeTypes =
      action === 'indent'
        ? [schema.nodes.section_title, schema.nodes.paragraph] // Allowed nodes for indent
        : [schema.nodes.paragraph] // Allowed nodes for unindent

    if (!allowedNodeTypes.includes(nodeType)) {
      return false
    }

    const isInBody = hasParentNodeOfType(schema.nodes.body)(state.selection)
    const isDeletedNode = isDeleted($from.node($from.depth))

    if (!isInBody || isDeletedNode) {
      return false
    }

    if (nodeType === schema.nodes.paragraph) {
      const parentNode = $from.node($from.depth - 1)

      // Handle indentation and unindentation logic for paragraphs
      if (action === 'indent') {
        if (
          ![schema.nodes.section, schema.nodes.body].includes(parentNode?.type)
        ) {
          return false
        }
      } else if (action === 'unindent') {
        const topLevelSection = $from.node($from.depth - 2)
        if (
          parentNode?.type !== schema.nodes.section ||
          parentNode?.type === schema.nodes.body ||
          topLevelSection?.type === schema.nodes.body
        ) {
          return false
        }
      }
    }

    return true
  }

export const handleIndentationAction =
  (action: 'indent' | 'unindent') =>
  (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const { $from } = state.selection
    const nodeType = $from.node().type

    if (action === 'indent') {
      if (nodeType === schema.nodes.section_title) {
        indentSection()(state, dispatch, view)
      } else if (nodeType === schema.nodes.paragraph) {
        indentParagraph()(state, dispatch, view)
      }
    } else if (action === 'unindent') {
      if (nodeType === schema.nodes.paragraph) {
        unindentParagraph()(state, dispatch, view)
      }
    }
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

export const unindentParagraph =
  () => (state: EditorState, dispatch: Dispatch, view?: EditorView) => {
    const {
      selection: { $from },
      schema,
      tr,
      doc,
    } = state

    const sectionDepth = $from.depth - 1
    const parentSectionDepth = sectionDepth - 1

    const paragraph = $from.node($from.depth)
    const parentSection = $from.node(parentSectionDepth)

    const afterSection = $from.after(sectionDepth)
    const $afterSection = doc.resolve(afterSection)
    const afterSectionOffset = $afterSection.parentOffset

    const paragraphPos = $from.before($from.depth)
    const parentSectionEnd = $from.end(parentSectionDepth)

    let sectionContent = Fragment.from(schema.nodes.section_title.create())

    sectionContent = sectionContent
      .append(Fragment.from(paragraph))
      .append(parentSection.content.cut(afterSectionOffset))

    const newSection = schema.nodes.section.create(
      { id: generateNodeID(schema.nodes.section) },
      sectionContent
    )

    tr.delete(paragraphPos, parentSectionEnd)
    tr.insert(paragraphPos + 2, newSection)

    tr.setSelection(TextSelection.create(tr.doc, parentSectionEnd + 2))

    dispatch(skipTracking(tr))
    view?.focus()
  }
