import {
  Affiliation,
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
  Citation,
  CitationItem,
  Contributor,
  EmbeddedModel,
  Figure,
  Footnote,
  InlineMathFragment,
  Keyword,
  Manuscript,
  ParagraphElement,
  Project,
  Section,
  UserProfileAffiliation,
} from '@manuscripts/manuscripts-json-schema'
import { generateID } from './id'
import {
  AuxiliaryObjectReference,
  CommentAnnotation,
  CommentSelector,
  ManuscriptModel,
  ModelAttachment,
} from './models'
import {
  AFFILIATION,
  AUXILIARY_OBJECT_REFERENCE,
  BIBLIOGRAPHIC_DATE,
  BIBLIOGRAPHIC_NAME,
  BIBLIOGRAPHY_ITEM,
  CITATION,
  CITATION_ITEM,
  COMMENT_ANNOTATION,
  CONTRIBUTOR,
  FIGURE,
  FOOTNOTE,
  INLINE_MATH_FRAGMENT,
  KEYWORD,
  MANUSCRIPT,
  PARAGRAPH,
  PROJECT,
  SECTION,
  USER_PROFILE_AFFILIATION,
} from './object-types'

export const DEFAULT_BUNDLE = 'MPBundle:www-zotero-org-styles-nature'

export type Build<T> = Pick<T, Exclude<keyof T, keyof ManuscriptModel>> & {
  _id: string
  objectType: string
}

// export interface EmbeddedModel {
//   _id: string
//   objectType: string
// }

export type BuildEmbedded<T extends EmbeddedModel, O> = Pick<
  T,
  Exclude<keyof T, keyof ManuscriptModel>
> & {
  _id: string
  objectType: O
}

export const buildProject = (owner: string): Build<Project> => ({
  _id: generateID(PROJECT),
  objectType: PROJECT,
  owners: [owner],
  writers: [],
  viewers: [],
  title: '',
})

export const buildManuscript = (title: string = ''): Build<Manuscript> => ({
  _id: generateID(MANUSCRIPT),
  objectType: MANUSCRIPT,
  title,
  bundle: DEFAULT_BUNDLE,
})

export type ContributorRole = 'author'

export const buildContributor = (
  bibliographicName: BibliographicName,
  role: ContributorRole = 'author',
  priority: number = 0,
  userID?: string,
  invitationID?: string
): Build<Contributor> => ({
  _id: generateID(CONTRIBUTOR),
  objectType: CONTRIBUTOR,
  priority,
  role,
  affiliations: [],
  bibliographicName: buildBibliographicName(bibliographicName),
  userID,
  invitationID,
})

export const buildBibliographyItem = (
  data: Partial<Build<BibliographyItem>>
): Build<BibliographyItem> => ({
  ...data,
  type: data.type || 'article-journal',
  _id: generateID(BIBLIOGRAPHY_ITEM),
  objectType: BIBLIOGRAPHY_ITEM,
})

export const buildBibliographicName = (
  data: Partial<BibliographicName>
): BuildEmbedded<BibliographicName, 'MPBibliographicName'> => ({
  ...data,
  _id: generateID(BIBLIOGRAPHIC_NAME),
  objectType: BIBLIOGRAPHIC_NAME,
})

export const buildBibliographicDate = (
  data: Partial<CSL.StructuredDate>
): BuildEmbedded<BibliographicDate, 'MPBibliographicDate'> => ({
  ...data,
  _id: generateID(BIBLIOGRAPHIC_DATE),
  objectType: BIBLIOGRAPHIC_DATE,
})

export const buildAuxiliaryObjectReference = (
  containingObject: string,
  referencedObject: string
): Build<AuxiliaryObjectReference> => ({
  _id: generateID(AUXILIARY_OBJECT_REFERENCE),
  objectType: AUXILIARY_OBJECT_REFERENCE,
  containingObject,
  referencedObject,
})

export const buildEmbeddedCitationItem = (
  bibliographyItem: string
): CitationItem => ({
  _id: generateID(CITATION_ITEM),
  objectType: CITATION_ITEM,
  bibliographyItem,
})

export const buildCitation = (
  containingObject: string,
  embeddedCitationItems: string[]
): Build<Citation> => ({
  _id: generateID(CITATION),
  objectType: CITATION,
  containingObject,
  embeddedCitationItems: embeddedCitationItems.map(buildEmbeddedCitationItem),
})

export const buildKeyword = (name: string): Build<Keyword> => ({
  _id: generateID(KEYWORD),
  objectType: KEYWORD,
  name,
})

export const buildFigure = (file: File): Build<Figure & ModelAttachment> => ({
  _id: generateID(FIGURE),
  objectType: FIGURE,
  contentType: file.type,
  src: window.URL.createObjectURL(file),
  attachment: {
    id: 'image',
    type: file.type,
    data: file,
  },
})

export const buildAffiliation = (
  institution: string,
  priority: number = 0
): Build<Affiliation> => ({
  _id: generateID(AFFILIATION),
  objectType: AFFILIATION,
  institution,
  priority,
})

export const buildUserProfileAffiliation = (
  institution: string,
  priority: number = 0
): Build<UserProfileAffiliation> => ({
  _id: generateID(USER_PROFILE_AFFILIATION),
  objectType: USER_PROFILE_AFFILIATION,
  institution,
  priority,
})

export const buildComment = (
  userID: string,
  target: string,
  contents: string = '',
  selector?: CommentSelector
): Build<CommentAnnotation> => ({
  _id: generateID(COMMENT_ANNOTATION),
  objectType: COMMENT_ANNOTATION,
  userID,
  target,
  selector,
  contents,
})

export const buildInlineMathFragment = (
  containingObject: string,
  TeXRepresentation: string
): Build<InlineMathFragment> => ({
  _id: generateID(INLINE_MATH_FRAGMENT),
  objectType: INLINE_MATH_FRAGMENT,
  containingObject,
  TeXRepresentation,
})

export const buildFootnote = (
  containingObject: string,
  contents: string
): Build<Footnote> => ({
  _id: generateID(FOOTNOTE),
  objectType: FOOTNOTE,
  containingObject,
  contents,
})

export const buildSection = (
  priority: number = 0,
  path: string[] = []
): Build<Section> => {
  const id = generateID(SECTION)

  return {
    _id: id,
    objectType: SECTION,
    priority,
    path: path.concat(id),
  }
}

export const buildParagraph = (contents: string): Build<ParagraphElement> => ({
  _id: generateID(PARAGRAPH),
  objectType: PARAGRAPH,
  elementType: 'p',
  contents,
})
