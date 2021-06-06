"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUpdateReadStatus = exports.onCreateMessage = void 0;
const functions = require("firebase-functions");
const firebase_settings_1 = require("./config/firebase-settings");
const document_1 = require("./models/document");
const firestore_1 = require("./firestore");
exports.onCreateMessage = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .firestore.document('channels/{channelId}/messages/{messageId}')
    .onCreate(async (snapshot, { params: { channelId, messageId } }) => {
    console.log('onCreateMessage');
    const message = new document_1.default(snapshot).data;
    const channelUsers = await firestore_1.getDocumentList(`channels/${channelId}/users/`);
    const batch = firebase_settings_1.adminDB.batch();
    channelUsers.forEach((user) => {
        const userId = user.data.id;
        let updateData;
        if (userId === message.senderId) {
            updateData = {
                lastMessage: message.message,
                date: firebase_settings_1.adminFV.serverTimestamp(),
            };
        }
        else {
            updateData = {
                lastMessage: message.message,
                unreadCounter: firebase_settings_1.adminFV.increment(1),
                date: firebase_settings_1.adminFV.serverTimestamp(),
            };
        }
        batch.update(firebase_settings_1.adminDB.doc(`users/${userId}/channels/${channelId}`), updateData);
    });
    batch.update(firebase_settings_1.adminDB.doc(`channels/${channelId}`), {
        lastMessageDate: firebase_settings_1.adminFV.serverTimestamp(),
    });
    batch.commit();
});
exports.onUpdateReadStatus = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .firestore.document('channels/{channelId}/messages/{messageId}/readStatus/{userId}')
    .onUpdate(async (_snapshot, { params: { channelId, messageId, userId } }) => {
    console.log('onUpdateReadStatus');
    firebase_settings_1.adminDB.doc(`channels/${channelId}/messages/${messageId}`).update({
        readCounter: firebase_settings_1.adminFV.increment(1),
        readDate: firebase_settings_1.adminFV.serverTimestamp(),
    });
});
//# sourceMappingURL=message.js.map