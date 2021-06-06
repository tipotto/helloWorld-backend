"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentList = exports.getDocument = void 0;
const firebase_settings_1 = require("./config/firebase-settings");
const document_1 = require("./models/document");
exports.getDocument = async (documentPath) => {
    return firebase_settings_1.adminDB
        .doc(documentPath)
        .get()
        .then((s) => new document_1.default(s));
};
exports.getDocumentList = async (collectionPath) => {
    return firebase_settings_1.adminDB
        .collection(collectionPath)
        .get()
        .then((querySnaps) => {
        const docSnaps = querySnaps.docs;
        return docSnaps.map((s) => new document_1.default(s));
    });
};
//# sourceMappingURL=firestore.js.map