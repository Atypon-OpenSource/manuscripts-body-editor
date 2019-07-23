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
import axios from 'axios';
import { convertDataToBibliographyItem } from '../csl';
const search = (query, rows, mailto) => __awaiter(this, void 0, void 0, function* () {
    if (query.trim().match(/^10\.\S+\/\S+$/)) {
        return searchByDOI(query.trim(), mailto);
    }
    const response = yield axios.get(`https://api.crossref.org/works?mailto=${mailto}`, {
        params: {
            filter: 'type:journal-article',
            query,
            rows,
        },
    });
    if (response.status !== 200) {
        throw new Error('There was a problem searching for this query.');
    }
    const { message: { items, 'total-results': total }, } = response.data;
    return {
        items: items.map(convertDataToBibliographyItem),
        total,
    };
});
const searchByDOI = (doi, mailto) => __awaiter(this, void 0, void 0, function* () {
    const response = yield axios.get(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${mailto}`);
    if (response.status === 404) {
        throw new Error('An item with this DOI could not be found.');
    }
    if (response.status !== 200) {
        throw new Error('There was a problem searching for this DOI.');
    }
    const { message } = response.data;
    const item = convertDataToBibliographyItem(message);
    return {
        items: [item],
        total: 1,
    };
});
const fetch = (doi, mailto) => __awaiter(this, void 0, void 0, function* () {
    const response = yield axios.get(`https://data.crossref.org/${encodeURIComponent(doi)}`, {
        headers: {
            accept: 'application/vnd.citationstyles.csl+json',
        },
    });
    if (response.status === 404) {
        throw new Error('An item with this DOI could not be found.');
    }
    if (response.status !== 200) {
        throw new Error('There was a problem fetching this DOI.');
    }
    return convertDataToBibliographyItem(response.data);
});
export const crossref = { fetch, search };
