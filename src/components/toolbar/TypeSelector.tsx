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
import { TickIcon } from '@manuscripts/style-guide'
import { skipTracking } from '@manuscripts/track-changes-plugin'
import {
  generateNodeID,
  isSectionNodeType,
  ManuscriptEditorState,
  ManuscriptEditorView,
  ManuscriptNodeType,
  nodeNames,
  SectionTitleNode,
} from '@manuscripts/transform'
import { Fragment } from 'prosemirror-model'
import { TextSelection, Transaction } from 'prosemirror-state'
import React from 'react'
import Select, {
  CSSObjectWithLabel,
  OnChangeValue,
  OptionProps,
} from 'react-select'
import styled from 'styled-components'

import { findClosestParentElement } from '../../lib/hierarchy'

interface Option {
  action?: () => void
  isDisabled: boolean
  isSelected: boolean
  label: string
  nodeType: ManuscriptNodeType
}

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
  min-width: 200px;

  &:hover {
    background: ${(props) => props.theme.colors.background.fifth};
  }
`
const OptionLabel = styled.span``

const TickIconWrapper = styled.div`
  margin-right: 16px;
`

const optionName = (nodeType: ManuscriptNodeType) => {
  switch (nodeType) {
    case nodeType.schema.nodes.section:
      return 'Heading'

    default:
      return nodeNames.get(nodeType) || nodeType.name
  }
}

const titleCase = (text: string) =>
  text.replace(/\b([a-z])/g, (match) => match.toUpperCase())

const OptionComponent: React.FC<OptionProps<Option, false>> = ({
  innerProps,
  data,
}) => {
  return (
    <OptionContainer {...innerProps} ref={null}>
      <OptionLabel>{titleCase(optionName(data.nodeType))}</OptionLabel>
      {data.isSelected && (
        <TickIconWrapper>
          <TickIcon />
        </TickIconWrapper>
      )}
    </OptionContainer>
  )
}

const buildOptions = (
  state: ManuscriptEditorState,
  dispatch: (tr: Transaction) => void,
  view?: ManuscriptEditorView
): Option[] => {
  const {
    doc,
    selection: { $from, $to },
    schema,
    tr,
  } = state
  const { nodes } = schema

  if (!$from.sameParent($to)) {
    return []
  }

  const parentElement = findClosestParentElement($from)

  if (!parentElement) {
    return []
  }

  const promoteParagraphToSection = () => () => {
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

    const items = []
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

    items.push(parentSection.copy(sectionContent))

    tr.replaceWith(beforeParentSection, afterParentSection, items)
    const anchor = beforeParentSection + offset + 2

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + sectionTitle.content.size)
    )

    dispatch(skipTracking(tr))
    view && view.focus()
  }

  const demoteSectionToParagraph = () => {
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

    if (previousNode && isSectionNodeType(previousNode.type)) {
      tr.replaceWith(
        beforeSection - previousNode.nodeSize,
        afterSection,
        previousNode.copy(
          Fragment.from(previousNode.content)
            .append(Fragment.from(paragraph))
            .append(section.content.cut(afterSectionTitleOffset))
        )
      )

      anchor = beforeSection
    } else {
      tr.replaceWith(
        beforeSection,
        afterSection,
        Fragment.from(paragraph).append(
          section.content.cut(afterSectionTitleOffset)
        )
      )

      anchor = beforeSection + 1
    }

    tr.setSelection(
      TextSelection.create(tr.doc, anchor, anchor + paragraph.content.size)
    )

    dispatch(skipTracking(tr))
    view && view.focus()
  }

  const parentElementType = parentElement.node.type
  const options: Option[] = []

  switch (parentElementType) {
    case parentElementType.schema.nodes.section: {
      const sectionDepth = Math.max(1, $from.depth - 1)
      const beforeSection = $from.before(sectionDepth)
      const $beforeSection = doc.resolve(beforeSection)
      const sectionOffset = $beforeSection.parentOffset

      options.push(
        {
          nodeType: nodes.paragraph,
          label: 'Paragraph',
          action: demoteSectionToParagraph,
          isDisabled: sectionDepth <= 1 && sectionOffset <= 1,
        },
        {
          nodeType: nodes.section,
          label: 'Heading',
          isDisabled: true,
          isSelected: true,
        }
      )
      return options
    }
    case parentElementType.schema.nodes.paragraph: {
      const sectionDepth = $from.depth - 1
      const minimumDepth = Math.max(1, sectionDepth)
      options.push(
        {
          nodeType: nodes.paragraph,
          label: 'Paragraph',
          isDisabled: true,
          isSelected: true,
        },
        {
          nodeType: nodes.section,
          label: 'Heading',
          action: promoteParagraphToSection(minimumDepth),
        }
      )
      return options
    }
    default: {
      options.push({
        nodeType: parentElementType,
        label: titleCase(optionName(parentElementType)),
        isDisabled: true,
        isSelected: true,
      })
      return options
    }
  }
}

const StyledSelect = styled(Select<Option, false>)`
  & > div:hover {
    border-color: ${(props) => props.theme.colors.border.secondary};
  }
`

const findSelectedOption = (options: Option[]): Option | undefined => {
  for (const option of options) {
    if (option.isSelected) {
      return option
    }
  }
}

export const TypeSelector: React.FC<{
  state: ManuscriptEditorState
  dispatch: (tr: Transaction) => void
  view?: ManuscriptEditorView
}> = ({ state, dispatch, view }) => {
  const options = buildOptions(state, dispatch, view)
  return (
    <StyledSelect
      onChange={(value: OnChangeValue<Option, false>) => {
        if (value && value.action) {
          value.action()
        }
      }}
      value={
        options.length === 1
          ? (options[0] as Option | undefined)
          : findSelectedOption(options)
      }
      options={options}
      components={{
        Option: OptionComponent,
      }}
      styles={customStyles}
      isDisabled={options.length <= 1}
      isSearchable={false}
    />
  )
}

const customStyles = {
  control: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e2e2',
    boxShadow: 'none',
    fontSize: '14px',
    minHeight: 0,
    padding: 0,
    width: 200,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    height: 32,
  }),
  indicatorSeparator: (): CSSObjectWithLabel => ({
    display: 'none',
  }),
  dropdownIndicator: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    padding: '0 4px',
  }),
  menu: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    width: '200px',
  }),
  singleValue: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    padding: 0,
  }),
  valueContainer: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    padding: '1px 8px',
  }),
  container: (styles: CSSObjectWithLabel): CSSObjectWithLabel => ({
    ...styles,
    border: 'none',
  }),
}
