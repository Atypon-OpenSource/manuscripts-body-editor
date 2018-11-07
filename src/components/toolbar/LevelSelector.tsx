import { Fragment, Slice } from 'prosemirror-model'
import { TextSelection } from 'prosemirror-state'
import React, { CSSProperties } from 'react'
import Select from 'react-select'
import styled from 'styled-components'
import { findParentNodeWithId } from '../../lib/utils'
import { isSectionNode, SectionNode } from '../../schema/nodes/section'
import { SectionTitleNode } from '../../schema/nodes/section_title'
import { ManuscriptEditorView, ManuscriptNodeType } from '../../schema/types'
import { nodeNames } from '../../transformer/node-names'
import { nodeTypeIcon } from '../../transformer/node-type-icons'

const optionName = (nodeType: ManuscriptNodeType, depth: number) => {
  switch (nodeType) {
    case nodeType.schema.nodes.section:
      return 'sub'.repeat(depth - 1) + 'section heading'

    default:
      return nodeNames.get(nodeType) || nodeType.name
  }
}

const titleCase = (text: string) =>
  text.replace(/\b([a-z])/g, match => match.toUpperCase())

const buildOption = (
  nodeType: ManuscriptNodeType,
  value: number,
  depth: number,
  action?: () => void
): Option => ({
  value,
  depth,
  icon: nodeTypeIcon(nodeType),
  label: titleCase(optionName(nodeType, value)),
  nodeType,
  action,
})

const buildOptions = (view: ManuscriptEditorView): Option[] => {
  const {
    state: {
      selection: { $from, $to },
      schema: { nodes },
    },
  } = view

  const options: Option[] = []

  if (!$from.sameParent($to)) {
    return options
  }

  // move paragraph to title of new subsection
  const moveParagraphToNewSubsection = () => {
    const textContent = $from.parent.textContent

    const sectionTitle: SectionTitleNode = textContent
      ? nodes.section_title.create({}, view.state.schema.text(textContent))
      : nodes.section_title.create()

    const slice = new Slice(
      Fragment.from([nodes.section.create({}, [sectionTitle])]),
      0,
      0
    )

    const beforeParagraph = $from.before()
    const afterParagraph = $from.after()

    const tr = view.state.tr.replaceRange(
      beforeParagraph,
      afterParagraph,
      slice
    )

    view.focus()

    // select title of created section
    view.dispatch(
      tr.setSelection(
        TextSelection.between(
          tr.doc.resolve(beforeParagraph + 1),
          tr.doc.resolve(beforeParagraph + 1 + sectionTitle.nodeSize)
        )
      )
    )
  }

  // append the section to the preceding section as a subsection
  const moveSectionToSubsection = () => {
    const sectionTitle = $from.node()

    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const afterSection = $from.after(sectionDepth)

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)

    const previousSection = parentSection.child(startIndex - 1)

    const fragment = previousSection.content.append(Fragment.from(section))

    const slice = new Slice(fragment, 0, 0)

    const beforePreviousSection = beforeSection - previousSection.nodeSize

    const tr = view.state.tr.replace(beforePreviousSection, afterSection, slice)

    view.focus()

    view.dispatch(
      tr.setSelection(
        TextSelection.between(
          tr.doc.resolve(beforePreviousSection + previousSection.nodeSize),
          tr.doc.resolve(
            beforePreviousSection +
              previousSection.nodeSize +
              sectionTitle.nodeSize
          )
        )
      )
    )
  }

  // move the section up the tree
  // TODO: target depth
  const promoteSection = (target: number) => () => {
    const sectionDepth = $from.depth - 1
    const section = $from.node(sectionDepth)
    const beforeSection = $from.before(sectionDepth)
    const sectionTitle = $from.node($from.depth)

    const $beforeSection = view.state.tr.doc.resolve(beforeSection)
    const beforeSectionOffset = $beforeSection.parentOffset
    const afterSectionOffset = beforeSectionOffset + section.nodeSize

    const parentSectionDepth = $from.depth - 2
    const parentSection = $from.node(parentSectionDepth)
    const startIndex = $from.index(parentSectionDepth)
    const endIndex = $from.indexAfter(parentSectionDepth)
    const beforeParentSection = $from.before(parentSectionDepth)
    const afterParentSection = $from.after(parentSectionDepth)
    const parentSectionStart = $from.start(parentSectionDepth)

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

    const slice = new Slice(Fragment.from(items), 0, 0)

    const tr = view.state.tr.replaceRange(
      beforeParentSection,
      afterParentSection,
      slice
    )

    view.focus()

    view.dispatch(
      tr.setSelection(
        TextSelection.between(
          tr.doc.resolve(beforeParentSection + offset),
          tr.doc.resolve(parentSectionStart + offset + sectionTitle.nodeSize)
        )
      )
    )
  }

  // move paragraph to title of new section at this position
  // TODO: target depth
  const promoteParagraphToSection = (target: number) => () => {
    const paragraph = $from.node($from.depth)
    const beforeParagraph = $from.before($from.depth)
    const $beforeParagraph = view.state.tr.doc.resolve(beforeParagraph)
    const beforeParagraphOffset = $beforeParagraph.parentOffset
    const afterParagraphOffset = beforeParagraphOffset + paragraph.nodeSize

    const sectionDepth = $from.depth - 1
    const parentSection = $from.node(sectionDepth)
    const startIndex = $from.index(sectionDepth)
    const endIndex = $from.indexAfter(sectionDepth)
    const beforeParentSection = $from.before(sectionDepth)
    const afterParentSection = $from.after(sectionDepth)
    const parentSectionStart = $from.start(sectionDepth)

    const items = []
    let offset = 0

    if (startIndex > 0) {
      // add the original section with content up to the paragraph
      const precedingSection = parentSection.cut(0, beforeParagraphOffset)
      items.push(precedingSection)
      offset += precedingSection.nodeSize
    }

    const sectionTitle = nodes.section_title.create(
      {},
      view.state.schema.text(paragraph.textContent)
    )

    items.push(
      // add a new section with the paragraph contents as the title and an empty paragraph
      parentSection.copy(Fragment.fromArray([sectionTitle, paragraph.copy()]))
    )

    // add another section with the rest of the original section
    if (endIndex < parentSection.childCount) {
      const fragment = Fragment.from(nodes.section_title.create()).append(
        parentSection.content.cut(afterParagraphOffset)
      )

      items.push(parentSection.copy(fragment))
    }

    const slice = new Slice(Fragment.from(items), 0, 0)

    const tr = view.state.tr.replaceRange(
      beforeParentSection,
      afterParentSection,
      slice
    )

    view.focus()

    view.dispatch(
      tr.setSelection(
        TextSelection.between(
          tr.doc.resolve(beforeParentSection + offset),
          tr.doc.resolve(parentSectionStart + offset + sectionTitle.nodeSize)
        )
      )
    )
  }

  switch ($from.parent.type) {
    case nodes.section_title: {
      const sectionDepth = $from.depth - 1

      let parentSectionDepth = 0

      for (
        let depth = Math.max(1, sectionDepth - 1);
        depth < sectionDepth;
        depth++
      ) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          options.push(
            buildOption(nodes.section, depth, depth, promoteSection(depth))
          )
          parentSectionDepth = depth
        }
      }

      options.push(
        buildOption(
          nodes.section,
          parentSectionDepth + 1,
          parentSectionDepth + 1
        )
      )

      const parentSection = $from.node(parentSectionDepth)

      const beforeSectionPos = $from.before(parentSectionDepth + 1)
      const $beforeSectionPos = view.state.tr.doc.resolve(beforeSectionPos)

      const precedingSections: SectionNode[] = []

      parentSection.nodesBetween(0, $beforeSectionPos.parentOffset, node => {
        if (isSectionNode(node)) {
          precedingSections.push(node)
        }
        return false
      })

      if (precedingSections.length > 0) {
        options.push(
          buildOption(
            nodes.section,
            parentSectionDepth + 2,
            parentSectionDepth + 2,
            moveSectionToSubsection
          )
        )
      }

      return options
    }

    case nodes.paragraph: {
      const sectionDepth = $from.depth - 1

      let parentSectionDepth = 0

      for (
        let depth = Math.max(1, sectionDepth);
        depth <= sectionDepth;
        depth++
      ) {
        const node = $from.node(depth)

        if (isSectionNode(node)) {
          options.push(
            buildOption(
              nodes.section,
              depth,
              depth,
              promoteParagraphToSection(depth)
            )
          )

          parentSectionDepth = depth
        }
      }

      options.push(buildOption(nodes.paragraph, -1, parentSectionDepth + 1))

      options.push(
        buildOption(
          nodes.section,
          parentSectionDepth + 1,
          parentSectionDepth + 1,
          moveParagraphToNewSubsection
        )
      )

      return options
    }

    default: {
      const parentNodeWithId = findParentNodeWithId(view.state.selection)

      if (parentNodeWithId) {
        options.push(
          buildOption(parentNodeWithId.node.type, -1, parentNodeWithId.depth)
        )
      }

      return options
    }
  }
}

const OptionContainer = styled.div`
  display: flex;
  align-items: center;
`

const OptionIcon = styled.span`
  display: inline-flex;
  width: 16px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  flex-shrink: 0;
`

const OptionLabel = styled.span`
  flex: 1;
`

interface Option {
  nodeType: ManuscriptNodeType
  icon: JSX.Element | null
  value: number
  depth: number
  label: string
  action?: () => void
}

interface Props {
  view: ManuscriptEditorView
}

export const LevelSelector: React.SFC<Props> = ({ view }) => {
  const {
    state: {
      schema: { nodes },
    },
  } = view

  const options = buildOptions(view)
  const selected = options.find(option => !option.action)

  return (
    <Select
      isDisabled={options.length <= 1}
      isSearchable={false}
      options={options}
      value={selected}
      components={{
        Option: (props: any) => {
          const data = props.data as Option

          const style = props.getStyles('option', props)

          style.display = 'flex'
          style.fontSize = 15
          style.paddingLeft = 8 + (data.depth - 1) * 16

          if (data.nodeType === nodes.section) {
            style.fontSize = Math.max(14, 23 - 3 * (data.value - 1))
            style.fontWeight = 600
          }

          return (
            <OptionContainer
              {...props.innerProps}
              style={style}
              depth={data.value}
            >
              <OptionIcon>{nodeTypeIcon(data.nodeType)}</OptionIcon>
              <OptionLabel>{data.label}</OptionLabel>
            </OptionContainer>
          )
        },
      }}
      onChange={value => {
        if (!value) return

        const selectedValue = value as Option

        if (selectedValue.action) {
          selectedValue.action()
        }
      }}
      styles={{
        control: (styles): CSSProperties => ({
          ...styles,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#d6d6d6',
          fontSize: '14px',
          minHeight: 0,
          padding: 0,
          width: 200,
          overflowX: 'hidden',
          textOverflow: 'ellipsis',
        }),
        indicatorSeparator: (): CSSProperties => ({
          display: 'none',
        }),
        dropdownIndicator: (styles): CSSProperties => ({
          ...styles,
          padding: '0 4px',
        }),
        menu: (styles): CSSProperties => ({
          ...styles,
          width: 'auto',
        }),
        singleValue: (styles): CSSProperties => ({
          ...styles,
          padding: 0,
        }),
        valueContainer: (styles): CSSProperties => ({
          ...styles,
          padding: '1px 8px',
        }),
      }}
    />
  )
}
