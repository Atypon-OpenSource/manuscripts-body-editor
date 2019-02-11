import {
  Contributor,
  Manuscript,
  Model,
  ObjectTypes,
} from '@manuscripts/manuscripts-json-schema'
import { DOMOutputSpec, DOMSerializer } from 'prosemirror-model'
import {
  Decoder,
  ManuscriptFragment,
  ManuscriptMark,
  ManuscriptNode,
  ManuscriptSchema,
  Marks,
  Nodes,
} from '..'
import { xmlSerializer } from './serializer'

interface Attrs {
  [key: string]: string
}

type NodeSpecs = { [key in Nodes]: (node: ManuscriptNode) => DOMOutputSpec }

type MarkSpecs = {
  [key in Marks]: (mark: ManuscriptMark, inline: boolean) => DOMOutputSpec
}

const nodes = (document: Document): NodeSpecs => ({
  bibliography_element: () => ['ref-list', 0],
  bibliography_section: () => ['back', 0],
  bullet_list: () => ['list', { 'list-type': 'bullet' }, 0],
  caption: () => ['caption', 0],
  citation: node => {
    const xref = document.createElement('xref')
    xref.setAttribute('ref-type', 'bibr')
    xref.setAttribute('rid', node.attrs.rid)
    xref.textContent = node.attrs.label

    return xref
  },
  cross_reference: node => [
    'xref',
    {
      'ref-type': 'bibr',
      rid: node.attrs.rid,
    },
    0,
  ],
  doc: () => ['div', 0],
  equation: node => {
    const math = document.createElement('tex-math')
    math.textContent = node.attrs.TeXRepresentation

    const formula = document.createElement('disp-formula')
    formula.appendChild(math)

    return formula
  },
  equation_element: node => ['fig', { id: node.attrs.id }, 0],
  figcaption: () => ['caption', 0],
  figure_element: node => ['fig', { id: node.attrs.id }, 0],
  footnote: node => ['fn', { id: node.attrs.id }, 0],
  footnotes_element: node => ['fn-group', { id: node.attrs.id }, 0],
  hard_break: () => 'break',
  inline_equation: node => {
    const math = document.createElement('tex-math')
    math.textContent = node.attrs.TeXRepresentation

    const formula = document.createElement('inline-formula')
    formula.appendChild(math)

    return formula
  },
  inline_footnote: node => {
    const xref = document.createElement('xref')
    xref.setAttribute('ref-type', 'fn')
    xref.setAttribute('rid', node.attrs.rid)
    xref.textContent = node.attrs.contents

    return xref
  },
  list_item: () => ['list-item', 0],
  listing: node => {
    const code = document.createElement('code')
    code.setAttribute('id', node.attrs.id)
    code.setAttribute('language', node.attrs.languageKey)
    code.textContent = node.attrs.contents

    return code
  },
  listing_element: node => ['fig', { id: node.attrs.id }, 0],
  manuscript: node => ['article', { id: node.attrs.id }, 0],
  ordered_list: () => ['list', { 'list-type': 'ordered' }, 0],
  paragraph: node => {
    const attrs: Attrs = {}

    if (node.attrs.id) {
      attrs.id = node.attrs.id
    }

    return ['p', attrs, 0]
  },
  placeholder: () => {
    throw new Error('Placeholder!')
  },
  placeholder_element: () => {
    throw new Error('Placeholder element!')
  },
  section: node => ['sec', { id: node.attrs.id }, 0],
  section_title: () => ['title', 0],
  table: node => [
    'table',
    {
      xmlns: 'http://www.w3.org/1999/xhtml',
      id: node.attrs.id,
    },
    0,
  ],
  table_element: node => ['table-wrap', { id: node.attrs.id }, 0],
  table_cell: () => ['td', 0],
  tbody_row: () => ['tr', 0],
  text: node => node.text!,
  tfoot_row: () => ['tr', 0],
  thead_row: () => ['tr', 0],
  toc_element: node => ['div', { id: node.attrs.id }, 0],
  toc_section: node => ['sec', { id: node.attrs.id }, 0],
})

const marks = (): MarkSpecs => ({
  bold: () => ['bold'],
  code: () => ['code', { position: 'anchor' }], // TODO: inline?
  italic: () => ['italic'],
  link: node => ['a', { href: node.attrs.href }],
  smallcaps: () => ['sc'],
  strikethrough: () => ['strike'],
  superscript: () => ['sup'],
  subscript: () => ['sub'],
  underline: () => ['underline'],
})

const download = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

const buildFront = (
  document: Document,
  manuscript: Manuscript,
  contributors?: Contributor[]
) => {
  const front = document.createElement('front')

  const articleMeta = document.createElement('article-meta')
  front.appendChild(articleMeta)

  const titleGroup = document.createElement('title-group')
  articleMeta.appendChild(titleGroup)

  const articleTitle = document.createElement('article-title')
  articleTitle.innerHTML = manuscript.title! // TODO: serialize to JATS from title-editor
  titleGroup.appendChild(articleTitle)

  if (contributors && contributors.length) {
    const contribGroup = document.createElement('contrib-group')
    contribGroup.setAttribute('content-type', 'authors')
    articleMeta.appendChild(contribGroup)

    contributors.sort((a, b) => Number(a.priority) - Number(b.priority))

    contributors.forEach(contributor => {
      const contrib = document.createElement('contrib')
      contrib.setAttribute('contrib-type', 'author')
      contrib.setAttribute('id', contributor._id)

      if (contributor.isCorresponding) {
        contrib.setAttribute('corresp', 'yes')
      }

      const name = document.createElement('name')
      contrib.appendChild(name)

      if (contributor.bibliographicName.given) {
        const givenNames = document.createElement('given-names')
        givenNames.textContent = contributor.bibliographicName.given
        name.appendChild(givenNames)
      }

      if (contributor.bibliographicName.family) {
        const surname = document.createElement('surname')
        surname.textContent = contributor.bibliographicName.family
        name.appendChild(surname)
      }

      if (contributor.email) {
        const email = document.createElement('email')
        email.textContent = contributor.email
        contrib.appendChild(email)
      }

      // TODO: link to affiliations

      contribGroup.appendChild(contrib)
    })
  }

  return front
}

const buildBody = (document: Document, fragment: ManuscriptFragment) => {
  const serializer = new DOMSerializer<ManuscriptSchema>(
    nodes(document),
    marks()
  )

  const content = serializer.serializeFragment(fragment, { document })

  const body = document.createElement('body')
  body.appendChild(content)

  return body
}

const fixBody = (document: Document, fragment: ManuscriptFragment) => {
  fragment.descendants(node => {
    if (node.attrs.id) {
      if (node.attrs.titleSuppressed) {
        const parent = document.getElementById(node.attrs.id)

        if (parent) {
          const title = parent.querySelector(':scope > title')

          if (title) {
            parent.removeChild(title)
          }
        }
      }

      if (node.attrs.suppressCaption) {
        const parent = document.getElementById(node.attrs.id)

        if (parent) {
          // TODO: need to query deeper?
          const caption = parent.querySelector(':scope > caption')

          if (caption) {
            parent.removeChild(caption)
          }
        }
      }
    }
  })
}

const buildBack = (document: Document) => {
  const back = document.createElement('back')

  // TODO: reference list

  return back
}

export const serializeToJATS = (
  fragment: ManuscriptFragment,
  manuscript: Manuscript,
  contributors: Contributor[]
) => {
  // const document = new XMLDocument()
  const document = new Document()

  const article = document.createElement('article')
  document.appendChild(article)

  const front = buildFront(document, manuscript, contributors)
  article.appendChild(front)

  const body = buildBody(document, fragment)
  article.appendChild(body)

  fixBody(document, fragment)

  const back = buildBack(document)
  article.appendChild(back)

  const output = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.1 20151215//EN" "http://jats.nlm.nih.gov/publishing/1.1/JATS-journalpublishing1.dtd">',
    xmlSerializer.serializeToString(article),
  ].join('\n')

  download(new Blob([output]), 'manuscript.xml')
}

const hasObjectType = <T extends Model>(objectType: string) => (
  model: Model
): model is T => model.objectType === objectType

export const exportToJATS = (projectBundle: { data: Model[] }) => {
  const manuscript = projectBundle.data.find(
    hasObjectType<Manuscript>(ObjectTypes.Manuscript)
  )

  if (!manuscript) {
    throw new Error('Manuscript not found')
  }

  const contributors = projectBundle.data.filter(
    hasObjectType<Contributor>(ObjectTypes.Contributor)
  )

  const modelMap: Map<string, Model> = new Map()

  for (const component of projectBundle.data) {
    modelMap.set(component._id, component)
  }

  const decoder = new Decoder(modelMap)

  const doc = decoder.createArticleNode()

  return serializeToJATS(doc.content, manuscript, contributors)
}
