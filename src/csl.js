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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { buildBibliographicDate, buildBibliographicName, } from '@manuscripts/manuscript-transform';
import axios from 'axios';
import { basename } from 'path';
const roleFields = [
    'author',
    'collection-editor',
    'composer',
    'container-author',
    'director',
    'editor',
    'editorial-director',
    'interviewer',
    'illustrator',
    'original-author',
    'recipient',
    'reviewed-author',
    'translator',
];
const dateFields = [
    'accessed',
    'container',
    'event-date',
    'issued',
    'original-date',
    'submitted',
];
const standardFields = [
    'abstract',
    'annote',
    'archive',
    'archive-place',
    'archive_location',
    'authority',
    'call-number',
    'categories',
    'chapter-number',
    'citation-label',
    'citation-number',
    'collection-number',
    'collection-title',
    'container-title',
    'container-title-short',
    'dimensions',
    'DOI',
    'edition',
    'event',
    'event-place',
    'first-reference-note-number',
    'genre',
    'ISBN',
    'ISSN',
    'issue',
    'journalAbbreviation',
    'jurisdiction',
    'keyword',
    'language',
    'locator',
    'medium',
    'note',
    'number',
    'number-of-pages',
    'number-of-volumes',
    'original-publisher',
    'original-publisher-place',
    'original-title',
    'page',
    'page-first',
    'PMCID',
    'PMID',
    'publisher',
    'publisher-place',
    'references',
    'reviewed-title',
    'scale',
    'section',
    'shortTitle',
    'source',
    'status',
    'title',
    'title-short',
    'type',
    'URL',
    'version',
    'volume',
    'year-suffix',
];
export const convertDataToBibliographyItem = (data) => {
    const output = {};
    for (const [key, item] of Object.entries(data)) {
        if (key === 'circa') {
            output[key] = Boolean(item);
        }
        else if (standardFields.includes(key)) {
            output[key] = item;
        }
        else if (roleFields.includes(key)) {
            output[key] = item.map(value => buildBibliographicName(value));
        }
        else if (dateFields.includes(key)) {
            output[key] = buildBibliographicDate(item);
        }
    }
    return output;
};
export const convertBibliographyItemToData = (bibliographyItem) => Object.entries(bibliographyItem).reduce((output, [key, item]) => {
    if (standardFields.includes(key)) {
        output[key] = item;
    }
    else if (roleFields.includes(key)) {
        output[key] = item.map(name => {
            const { _id, objectType } = name, rest = __rest(name, ["_id", "objectType"]);
            return rest;
        });
    }
    else if (dateFields.includes(key)) {
        const _a = item, { _id, objectType } = _a, rest = __rest(_a, ["_id", "objectType"]);
        output[key] = rest;
    }
    return output;
}, {
    id: bibliographyItem._id,
    type: bibliographyItem.type || 'article-journal',
});
export class CitationManager {
    constructor(baseURL) {
        this.createProcessor = (bundleID, primaryLanguageCode, getLibraryItem, bundle, citationStyleData) => __awaiter(this, void 0, void 0, function* () {
            if (!bundle) {
                bundle = yield this.fetchBundle(bundleID);
            }
            if (!bundle) {
                throw new Error('Bundle not found');
            }
            if (!citationStyleData) {
                citationStyleData = yield this.fetchCitationStyleString(bundle);
            }
            const citationLocales = yield this.fetchCitationLocales(citationStyleData, primaryLanguageCode);
            const CiteProc = yield import('citeproc');
            return new CiteProc.Engine({
                retrieveItem: (id) => {
                    const item = getLibraryItem(id);
                    if (!item) {
                        throw new Error('Library item not found');
                    }
                    return convertBibliographyItemToData(item);
                },
                retrieveLocale: (id) => citationLocales.get(id),
            }, citationStyleData, primaryLanguageCode, false);
        });
        this.fetchBundle = (bundleID) => __awaiter(this, void 0, void 0, function* () {
            const bundles = yield this.fetchBundles();
            const bundle = bundles.find(item => item._id === bundleID);
            if (!bundle) {
                throw new Error('Bundle not found: ' + bundleID);
            }
            return bundle;
        });
        this.fetchBundles = () => __awaiter(this, void 0, void 0, function* () { return this.fetchJSON('shared/bundles.json'); });
        this.fetchLocales = () => this.fetchJSON('csl/locales/locales.json');
        this.buildURL = (path) => this.baseURL + '/' + path;
        this.baseURL = baseURL;
    }
    fetchCitationStyleString(bundle) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bundle.csl || !bundle.csl.cslIdentifier) {
                throw new Error('No CSL identifier');
            }
            const cslIdentifier = basename(bundle.csl.cslIdentifier, '.csl');
            const citationStyleDoc = yield this.fetchCitationStyle(cslIdentifier);
            const serializer = new XMLSerializer();
            return serializer.serializeToString(citationStyleDoc);
        });
    }
    fetchCitationStyle(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.fetchStyle(id);
            const parentURLNode = this.selectParentURL(doc);
            const parentURL = parentURLNode.stringValue;
            if (!parentURL || !parentURL.startsWith('http://www.zotero.org/styles/')) {
                return doc;
            }
            const parentDoc = yield this.fetchStyle(basename(parentURL));
            if (!parentDoc) {
                return doc;
            }
            const locales = this.selectLocaleNodes(doc);
            if (!locales.snapshotLength) {
                return parentDoc;
            }
            return parentDoc;
        });
    }
    fetchDocument(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios.get(this.buildURL(path), {
                responseType: 'document',
            });
            return response.data;
        });
    }
    fetchText(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios.get(this.buildURL(path), {
                responseType: 'text',
            });
            return response.data;
        });
    }
    fetchJSON(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios.get(this.buildURL(path));
            return response.data;
        });
    }
    fetchLocale(id) {
        return this.fetchText(`csl/locales/locales-${id}.xml`);
    }
    fetchStyle(id) {
        return this.fetchDocument(`csl/styles/${id}.csl`);
    }
    fetchCitationLocales(citationStyleData, primaryLanguageCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const CiteProc = yield import('citeproc');
            const locales = new Map();
            const localeNames = CiteProc.getLocaleNames(citationStyleData, primaryLanguageCode);
            yield Promise.all(localeNames.map((localeName) => __awaiter(this, void 0, void 0, function* () {
                const data = yield this.fetchLocale(localeName);
                locales.set(localeName, data);
            })));
            return locales;
        });
    }
    namespaceResolver(ns) {
        return ns === 'csl' ? 'http://purl.org/net/xbiblio/csl' : null;
    }
    selectParentURL(doc) {
        return doc.evaluate('string(/csl:style/csl:info/csl:link[@rel="independent-parent"]/@href)', doc, this.namespaceResolver, XPathResult.STRING_TYPE, null);
    }
    selectLocaleNodes(doc) {
        return doc.evaluate('/csl:style/csl:locale', doc, this.namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    }
}
