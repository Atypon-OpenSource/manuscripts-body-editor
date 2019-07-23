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
import { generateID } from '@manuscripts/manuscript-transform';
import { ObjectTypes, } from '@manuscripts/manuscripts-json-schema';
import axios from 'axios';
import { convertDataToBibliographyItem } from '../csl';
const buildIssuedDate = (dates) => {
    const issued = dates.find(item => item.dateType === 'Issued');
    if (!issued || !issued.date) {
        return undefined;
    }
    return {
        _id: generateID(ObjectTypes.BibliographicDate),
        objectType: ObjectTypes.BibliographicDate,
        'date-parts': [issued.date.split('-')],
    };
};
const convertResult = (item) => {
    const { creators, dates, doi, titles } = item.attributes;
    return {
        _id: generateID(ObjectTypes.BibliographyItem),
        objectType: ObjectTypes.BibliographyItem,
        DOI: doi,
        title: titles && titles.length ? titles[0].title : undefined,
        type: 'dataset',
        issued: buildIssuedDate(dates),
        author: creators.map(({ givenName: given, familyName: family, name }) => ({
            _id: generateID(ObjectTypes.BibliographicName),
            objectType: ObjectTypes.BibliographicName,
            given,
            family,
        })),
    };
};
const search = (query, rows) => __awaiter(this, void 0, void 0, function* () {
    if (query.trim().match(/^10\.\S+\/\S+$/)) {
        const data = yield fetch(query.trim());
        return {
            items: [data],
            total: 1,
        };
    }
    const response = yield axios.get('https://api.datacite.org/dois', {
        params: {
            query,
            'page[size]': rows,
        },
    });
    if (response.status !== 200) {
        throw new Error('There was a problem searching for this query.');
    }
    const { data, meta: { total }, } = response.data;
    return {
        items: data.map(convertResult),
        total,
    };
});
const fetch = (doi) => __awaiter(this, void 0, void 0, function* () {
    const response = yield axios.get('https://api.datacite.org/dois/' + encodeURIComponent(doi), {
        headers: {
            Accept: 'application/vnd.citationstyles.csl+json',
        },
    });
    if (response.status !== 200) {
        throw new Error('There was a problem fetching this item.');
    }
    return convertDataToBibliographyItem(response.data);
});
export const datacite = { fetch, search };
