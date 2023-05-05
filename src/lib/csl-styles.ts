/*!
 * © 2020 Atypon Systems LLC
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
import { Bundle } from '@manuscripts/json-schema'
import { evaluateXPathToString } from 'fontoxpath'

interface Options {
  bundleID?: string
  bundle?: Bundle
  citationStyleData?: string
}

const namespaceMap = new Map<string | null, string>([
  ['csl', 'http://purl.org/net/xbiblio/csl'],
])

const buildDependentStyle = async (citationStyleData: string) => {
  const doc = new DOMParser().parseFromString(
    citationStyleData,
    'application/xml'
  )
  const parentLink = evaluateXPathToString(
    '/csl:style/csl:info/csl:link[@rel="independent-parent"]/@href',
    doc,
    undefined,
    undefined,
    { namespaceResolver: (prefix: string) => namespaceMap.get(prefix) || null }
  )
  if (parentLink && parentLink.startsWith('http://www.zotero.org/styles/')) {
    return loadCSLStyle(parentLink)
  }
  return citationStyleData
}

export const findCSLStyleForBundleID = async (
  bundleID: string
): Promise<string | undefined> => {
  const { default: bundles }: { default: Bundle[] } = await import(
    // @ts-ignore
    '@manuscripts/data/dist/shared/bundles.json'
  )
  const bundle = bundles.find((item) => item._id === bundleID)

  return bundle && bundle.csl ? bundle.csl.cslIdentifier : undefined
}

export const loadCSLStyle = async (cslIdentifier: string): Promise<string> => {
  const basename = cslIdentifier.split('/').pop()
  if (!basename) {
    throw new Error(`No style name in ${cslIdentifier}`)
  }
  // short path `@manuscripts/data/dist/csl/styles/${basename[0]}.json` does not work locally
  const result = await import(
    `../../../node_modules/@manuscripts/data/dist/csl/styles/${basename[0]}.json`
  )

  const styles = (result.default || result) as Record<string, string> // no 'default' version is for compatibility with webpack based apps
  if (!styles[cslIdentifier]) {
    throw new Error(`Style ${cslIdentifier} not found`)
  }
  return styles[cslIdentifier]
}

export const loadCitationStyle = async (opts: Options): Promise<string> => {
  const { bundleID } = opts
  if (bundleID) {
    const foundBundleID = await findCSLStyleForBundleID(bundleID)
    if (!foundBundleID) {
      throw Error(`No csl style found for bundle ${bundleID}`)
    }
    return buildDependentStyle(await loadCSLStyle(foundBundleID))
  }

  throw Error('No bundleID provided for loadCitationStyle')
}
