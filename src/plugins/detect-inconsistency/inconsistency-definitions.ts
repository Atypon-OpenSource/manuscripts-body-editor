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

// Validators describe intent; the article editor executes the UI action.
export const inconsistencyDefinitions = {
  'missing-title': {
    title: 'Missing Title',
    message: 'Title has no content.',
    severity: 'error',
    category: 'empty-content',
  },
  'orphaned-affiliation': {
    title: 'Orphaned Affiliation',
    message: 'An affiliation entry exists but is not linked to any author.',
    severity: 'warning',
    category: 'not-used',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  'duplicate-affiliation': {
    title: 'Duplicate Affiliation',
    message:
      'Two or more affiliation entries appear to represent the same institution.',
    severity: 'warning',
    category: 'duplicate',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  'missing-cross-reference-target': {
    title: 'Missing Cross-reference Target',
    message: 'One or more referenced object IDs do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  'broken-citation': {
    title: 'Broken Citation',
    message:
      'Citation is empty or one or more bibliography references do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  'missing-footnote-target': {
    title: 'Missing Footnote Target',
    message: 'One or more referenced footnotes do not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  'missing-figure-file': {
    title: 'Missing Figure/Image File',
    message: 'Referenced uploaded file does not exist.',
    severity: 'error',
    category: 'missing-reference',
  },
  'missing-embedded-media': {
    title: 'Missing Embedded Media',
    message: 'Neither a valid URL nor an existing uploaded file is provided.',
    severity: 'error',
    category: 'missing-reference',
  },
  'invalid-link': {
    title: 'Invalid Link',
    message: 'URL is empty or invalid/unsupported.',
    severity: 'error',
    category: 'missing-reference',
  },
  'orphaned-footnote': {
    title: 'Orphaned Footnote',
    message: 'Footnote exists but is not referenced in the document.',
    severity: 'warning',
    category: 'not-used',
  },
  'duplicate-author': {
    title: 'Duplicate Author',
    message: 'Two or more author entries appear to represent the same person.',
    severity: 'warning',
    category: 'duplicate',
    action: { type: 'open-metadata', tab: 'authors' },
  },
  'empty-figure-panel': {
    title: 'Empty Figure Panel',
    message: 'A Figure Panel block exists with no image ever uploaded.',
    severity: 'error',
    category: 'empty-content',
  },
  'empty-image': {
    title: 'Empty Image',
    message: 'A standalone Image block exists with no image ever uploaded.',
    severity: 'error',
    category: 'empty-content',
  },
  'empty-hero-image': {
    title: 'Empty Hero Image',
    message: 'Hero Image is inserted with no image ever chosen.',
    severity: 'error',
    category: 'empty-content',
  },
  'empty-contributor-headshot': {
    title: 'Empty Contributor Headshot',
    message: 'A headshot card exists with no image ever chosen.',
    severity: 'error',
    category: 'empty-content',
  },
  'missing-alt-text': {
    title: 'Missing Alt Text',
    message: 'A Figure Panel, Table, or Media block has no alt text entered.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-accessibility' },
  },
  'missing-supplement-caption': {
    title: 'Missing Supplement Caption',
    message: 'A Supplementary item has no caption title or caption text.',
    severity: 'warning',
    category: 'empty-content',
  },
  'missing-abstract': {
    title: 'Missing Abstract',
    message:
      'No standard abstract element is present. A Graphical Abstract alone does not satisfy this check.',
    severity: 'error',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'abstract' },
  },
  'missing-main-document': {
    title: 'Missing Main document',
    message: 'No body content on the canvas and no main document uploaded.',
    severity: 'error',
    category: 'empty-content',
    action: { type: 'open-files', tab: 'main-document' },
  },
  'no-affiliations': {
    title: 'No Affiliations',
    message: 'No affiliation is assigned to any author.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'affiliations' },
  },
  'missing-conflict-of-interest': {
    title: 'Missing Conflict of Interest statement',
    message: 'No COI back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'conflict-of-interest' },
  },
  'missing-data-availability': {
    title: 'Missing Data Availability statement',
    message: 'No Data Availability back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'data-availability' },
  },
  'missing-funder': {
    title: 'Missing Funder information',
    message: 'No Funder Information section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'funder' },
  },
  'missing-ethics-statement': {
    title: 'Missing Ethics Statement',
    message: 'No Ethics Statement back-matter section is present.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'ethics-statement' },
  },
  'missing-keywords': {
    title: 'Missing Keywords',
    message: 'No keyword has been added to the document.',
    severity: 'warning',
    category: 'empty-content',
    action: { type: 'open-metadata', tab: 'keywords' },
  },
} satisfies Record<string, InconsistencyDefinition>
