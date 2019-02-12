import { Contributor, Manuscript } from '@manuscripts/manuscripts-json-schema'
import { DOMSerializer } from 'prosemirror-model'
import { ManuscriptFragment, ManuscriptSchema, schema } from '..'

const buildFront = (
  document: Document,
  manuscript: Manuscript,
  contributors?: Contributor[]
) => {
  const front = document.createElement('header')

  const articleMeta = document.createElement('div')
  front.appendChild(articleMeta)

  const articleTitle = document.createElement('h1')
  articleTitle.innerHTML = manuscript.title! // TODO: serialize to HTML from title-editor
  articleMeta.appendChild(articleTitle)

  if (contributors && contributors.length) {
    const contribGroup = document.createElement('div')
    articleMeta.appendChild(contribGroup)

    contributors.sort((a, b) => Number(a.priority) - Number(b.priority))

    contributors.forEach(contributor => {
      const contrib = document.createElement('span')
      contrib.setAttribute('id', contributor._id)

      if (contributor.isCorresponding) {
        contrib.setAttribute('data-corresp', 'yes')
      }

      const name = document.createElement('span')
      contrib.appendChild(name)

      if (contributor.bibliographicName.given) {
        const givenNames = document.createElement('span')
        givenNames.textContent = contributor.bibliographicName.given
        name.appendChild(givenNames)
      }

      if (contributor.bibliographicName.family) {
        const surname = document.createElement('span')
        surname.textContent = contributor.bibliographicName.family
        name.appendChild(surname)
      }

      // if (contributor.email) {
      //   const email = document.createElement('a')
      //   email.href = `mailto:${contributor.email}`
      //   contrib.appendChild(email)
      // }

      // TODO: link to affiliations

      contribGroup.appendChild(contrib)
    })
  }

  return front
}

const buildBody = (document: Document, fragment: ManuscriptFragment) => {
  const serializer = DOMSerializer.fromSchema<ManuscriptSchema>(schema)

  return serializer.serializeFragment(fragment, { document })
}

const fixBody = (document: Document, fragment: ManuscriptFragment) => {
  fragment.descendants(node => {
    if (node.attrs.id) {
      if (node.attrs.titleSuppressed) {
        const parent = document.getElementById(node.attrs.id)

        if (parent) {
          const title = parent.querySelector(':scope > h1')

          if (title) {
            parent.removeChild(title)
          }
        }
      }

      if (node.attrs.suppressCaption) {
        const parent = document.getElementById(node.attrs.id)

        if (parent) {
          // TODO: need to query deeper?
          const caption = parent.querySelector(':scope > figcaption')

          if (caption) {
            parent.removeChild(caption)
          }
        }
      }
    }
  })
}

const buildBack = (document: Document) => {
  const back = document.createElement('footer')

  // TODO: reference list

  return back
}

export const serializeToHTML = (
  fragment: ManuscriptFragment,
  manuscript: Manuscript,
  contributors?: Contributor[]
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

  const html = article.outerHTML

  const parts = ['<!DOCTYPE html>', html]

  return parts.join('\n')
}
