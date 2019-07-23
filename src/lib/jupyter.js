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
import { ContentsManager, ServerConnection, Session, } from '@jupyterlab/services';
import { blobToBase64String } from 'blob-util';
import { sha256 } from 'crypto-hash';
const remoteAttachmentLookupDocumentKey = (listingID) => `/_attachment_lookup:${listingID}`;
const ensureDirectoryExists = (contentsManager, listingID) => __awaiter(this, void 0, void 0, function* () {
    const directoryExists = yield contentsManager
        .get(listingID)
        .then(() => true)
        .catch(e => e.response.ok);
    if (!directoryExists) {
        const untitledDirectory = yield contentsManager.newUntitled({
            path: `/`,
            type: 'directory',
        });
        yield contentsManager.rename(untitledDirectory.path, listingID);
    }
});
const saveAttachmentMd5Lookup = (contentsManager, listingID, lookup) => __awaiter(this, void 0, void 0, function* () {
    const model = yield contentsManager.save(remoteAttachmentLookupDocumentKey(listingID), {
        content: JSON.stringify(lookup),
        type: 'file',
        format: 'text',
    });
    return model.content;
});
const getOrCreateAttachmentMd5Lookup = (contentsManager, listingID) => __awaiter(this, void 0, void 0, function* () {
    try {
        const model = yield contentsManager.get(remoteAttachmentLookupDocumentKey(listingID), { content: true });
        return JSON.parse(model.content);
    }
    catch (_a) {
        return saveAttachmentMd5Lookup(contentsManager, listingID, {});
    }
});
const deleteAttachment = (contentsManager, listingID, attachmentName, attachmentPath) => __awaiter(this, void 0, void 0, function* () {
    const attachmentMd5Lookup = yield getOrCreateAttachmentMd5Lookup(contentsManager, listingID);
    yield contentsManager.delete(attachmentPath);
    delete attachmentMd5Lookup[attachmentName];
    yield saveAttachmentMd5Lookup(contentsManager, listingID, attachmentMd5Lookup);
});
const saveAttachment = (contentsManager, listingID, attachment) => __awaiter(this, void 0, void 0, function* () {
    const attachmentMd5Lookup = yield getOrCreateAttachmentMd5Lookup(contentsManager, listingID);
    const content = yield blobToBase64String(attachment.data);
    yield contentsManager.save(`/${listingID}/${attachment.name}`, {
        content,
        type: 'file',
        format: 'base64',
    });
    attachmentMd5Lookup[attachment.name] = attachment.md5;
    yield saveAttachmentMd5Lookup(contentsManager, listingID, attachmentMd5Lookup);
});
const ensureAttachmentsExist = (contentsManager, listingID, attachments) => __awaiter(this, void 0, void 0, function* () {
    const attachmentMd5Lookup = yield getOrCreateAttachmentMd5Lookup(contentsManager, listingID);
    const model = yield contentsManager.get(`/${listingID}`);
    const exists = new Set([]);
    for (const remoteFile of model.content) {
        const remoteMd5 = attachmentMd5Lookup[remoteFile.name];
        if (remoteMd5) {
            if (attachments.find(({ md5 }) => md5 === remoteMd5)) {
                exists.add(remoteFile.name);
                continue;
            }
        }
        if (attachments.find(({ name }) => name === remoteFile.name)) {
            continue;
        }
        yield deleteAttachment(contentsManager, listingID, remoteFile.name, remoteFile.path);
    }
    for (const attachment of attachments) {
        if (!exists.has(attachment.name)) {
            yield saveAttachment(contentsManager, listingID, attachment);
        }
    }
});
const executionHash = (listingID, attachments, code, kernelName) => {
    let msg = '';
    msg += listingID;
    msg += code;
    msg += kernelName;
    msg += attachments.reduce((acc, { name, md5 }) => {
        return acc + name + md5;
    }, '');
    return sha256(msg);
};
export const kernels = {
    julia: 'julia',
    python: 'python',
    r: 'ir',
};
export const executeKernel = (serverConfig, listingID, attachments, code, languageKey, callback) => __awaiter(this, void 0, void 0, function* () {
    const kernelName = kernels[languageKey];
    if (!kernelName) {
        throw new Error(`No kernel is available for ${languageKey}`);
    }
    const hash = yield executionHash(listingID, attachments, code, kernelName);
    const serverSettings = ServerConnection.makeSettings({
        baseUrl: serverConfig.url,
        token: serverConfig.token,
        fetch: (input, init) => fetch(input, Object.assign({}, init, { headers: {
                Authorization: `token ${serverConfig.token}`,
            } })),
    });
    const contentsManager = new ContentsManager({ serverSettings });
    yield ensureDirectoryExists(contentsManager, listingID);
    yield ensureAttachmentsExist(contentsManager, listingID, attachments);
    const session = yield Session.startNew({
        kernelName,
        path: `${listingID}/${hash}.ipynb`,
        serverSettings,
    });
    const future = session.kernel.requestExecute({ code });
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        future.onIOPub = callback;
        yield future.done;
        yield session.shutdown();
        resolve();
    }));
});
