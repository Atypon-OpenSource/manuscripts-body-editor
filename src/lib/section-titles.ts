/*!
 * © 2019 Atypon Systems LLC
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

import { SectionCategory } from '@manuscripts/transform'

export const sectionTitles = new Map<SectionCategory, string>([
  ['MPSectionCategory:abstract', 'Abstract'],
  ['MPSectionCategory:abstract-graphical', 'Graphical  Abstract'],
  ['MPSectionCategory:introduction', 'Introduction'],
  ['MPSectionCategory:materials-method', 'Materials & Methods'],
  ['MPSectionCategory:results', 'Results'],
  ['MPSectionCategory:discussion', 'Discussion'],
  ['MPSectionCategory:conclusions', 'Conclusions'],
  ['MPSectionCategory:acknowledgement', 'Acknowledgments'],
  ['MPSectionCategory:availability', 'Availability'],
  [
    'MPSectionCategory:competing-interests',
    'COI Statement|Competing Interests',
  ],
  ['MPSectionCategory:con', 'Contributed-by information'],
  ['MPSectionCategory:ethics-statement', 'Ethics Statement'],
  ['MPSectionCategory:financial-disclosure', 'Financial Disclosure'],
  ['MPSectionCategory:supplementary-material', 'Supplementary Material'],
  ['MPSectionCategory:supported-by', 'Supported By'],
])
