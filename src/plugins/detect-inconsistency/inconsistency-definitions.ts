/*!
 * © 2026 Atypon Systems LLC
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

import type { Inconsistency } from './types'

type InconsistencyDefinition = Pick<
  Inconsistency,
  'title' | 'message' | 'severity' | 'category' | 'action'
>

export enum InconsistencyDefinitionKey {
  MissingTitle = 'missing-title',
  OrphanedAffiliation = 'orphaned-affiliation',
  DuplicateAffiliation = 'duplicate-affiliation',
  MissingCrossReferenceTarget = 'missing-cross-reference-target',
  BrokenCitation = 'broken-citation',
  MissingFootnoteTarget = 'missing-footnote-target',
  MissingFigureFile = 'missing-figure-file',
  MissingEmbeddedMedia = 'missing-embedded-media',
  InvalidLink = 'invalid-link',
  OrphanedFootnote = 'orphaned-footnote',
  DuplicateAuthor = 'duplicate-author',
  EmptyFigurePanel = 'empty-figure-panel',
  EmptyImage = 'empty-image',
  EmptyHeroImage = 'empty-hero-image',
  EmptyContributorHeadshot = 'empty-contributor-headshot',
  MissingAltText = 'missing-alt-text',
  MissingSupplementCaption = 'missing-supplement-caption',
  MissingAbstract = 'missing-abstract',
  MissingMainDocument = 'missing-main-document',
  NoAffiliations = 'no-affiliations',
  MissingConflictOfInterest = 'missing-conflict-of-interest',
  MissingDataAvailability = 'missing-data-availability',
  MissingFunder = 'missing-funder',
  MissingEthicsStatement = 'missing-ethics-statement',
  MissingKeywords = 'missing-keywords',
}

// Validators describe intent; the article editor executes the UI action.
export const inconsistencyDefinitions: Record<
  InconsistencyDefinitionKey,
  InconsistencyDefinition
> = {
  [InconsistencyDefinitionKey.MissingTitle]: {
    title: 'Missing Title',
    message: 'Title has no content.',
    severity: 'error',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.OrphanedAffiliation]: {
    title: 'Orphaned Affiliation',
    message: 'An affiliation entry exists but is not linked to any author.',
    severity: 'warning',
    category: 'not-used',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  [InconsistencyDefinitionKey.DuplicateAffiliation]: {
    title: 'Duplicate Affiliation',
    message:
      'Two or more affiliation entries appear to represent the same institution.',
    severity: 'warning',
    category: 'duplicate',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  [InconsistencyDefinitionKey.MissingCrossReferenceTarget]: {
    title: 'Missing Cross-reference Target',
    message: 'One or more referenced object IDs do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.BrokenCitation]: {
    title: 'Broken Citation',
    message:
      'Citation is empty or one or more bibliography references do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.MissingFootnoteTarget]: {
    title: 'Missing Footnote Target',
    message: 'One or more referenced footnotes do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.MissingFigureFile]: {
    title: 'Missing Figure/Image File',
    message: 'Referenced uploaded file does not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.MissingEmbeddedMedia]: {
    title: 'Missing Embedded Media',
    message: 'Neither a valid URL nor an existing uploaded file is provided.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.InvalidLink]: {
    title: 'Invalid Link',
    message: 'URL is empty or invalid/unsupported.',
    severity: 'error',
    category: 'missing-reference',
  },
  [InconsistencyDefinitionKey.OrphanedFootnote]: {
    title: 'Orphaned Footnote',
    message: 'Footnote exists but is not referenced in the document.',
    severity: 'warning',
    category: 'not-used',
  },
  [InconsistencyDefinitionKey.DuplicateAuthor]: {
    title: 'Duplicate Author',
    message: 'Two or more author entries appear to represent the same person.',
    severity: 'warning',
    category: 'duplicate',
    action: { type: 'open-metadata', tab: 'authors' },
  },
  [InconsistencyDefinitionKey.EmptyFigurePanel]: {
    title: 'Empty Figure Panel',
    message: 'A Figure Panel block exists with no image ever uploaded.',
    severity: 'error',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.EmptyImage]: {
    title: 'Empty Image',
    message: 'A standalone Image block exists with no image ever uploaded.',
    severity: 'error',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.EmptyHeroImage]: {
    title: 'Empty Hero Image',
    message: 'Hero Image is inserted with no image ever chosen.',
    severity: 'error',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.EmptyContributorHeadshot]: {
    title: 'Empty Contributor Headshot',
    message: 'A headshot card exists with no image ever chosen.',
    severity: 'error',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.MissingAltText]: {
    title: 'Missing Alt Text',
    message: 'A Figure Panel, Table, or Media block has no alt text entered.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-accessibility' },
  },
  [InconsistencyDefinitionKey.MissingSupplementCaption]: {
    title: 'Missing Supplement Caption',
    message: 'A Supplementary item has no caption title or caption text.',
    severity: 'warning',
    category: 'empty-content',
  },
  [InconsistencyDefinitionKey.MissingAbstract]: {
    title: 'Missing Abstract',
    message:
      'No standard abstract element is present. A Graphical Abstract alone does not satisfy this check.',
    severity: 'error',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'abstract' },
  },
  [InconsistencyDefinitionKey.MissingMainDocument]: {
    title: 'Missing Main document',
    message: 'No body content on the canvas and no main document uploaded.',
    severity: 'error',
    category: 'empty-content',
    action: { type: 'open-files', tab: 'main-document' },
  },
  [InconsistencyDefinitionKey.NoAffiliations]: {
    title: 'No Affiliations',
    message: 'No affiliation is assigned to any author.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  [InconsistencyDefinitionKey.MissingConflictOfInterest]: {
    title: 'Missing Conflict of Interest statement',
    message: 'No COI back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'conflict-of-interest' },
  },
  [InconsistencyDefinitionKey.MissingDataAvailability]: {
    title: 'Missing Data Availability statement',
    message: 'No Data Availability back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'data-availability' },
  },
  [InconsistencyDefinitionKey.MissingFunder]: {
    title: 'Missing Funder information',
    message: 'No Funder Information section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'funder' },
  },
  [InconsistencyDefinitionKey.MissingEthicsStatement]: {
    title: 'Missing Ethics Statement',
    message: 'No Ethics Statement back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'ethics-statement' },
  },
  [InconsistencyDefinitionKey.MissingKeywords]: {
    title: 'Missing Keywords',
    message: 'No keyword has been added to the document.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'keywords' },
  },
}
