import * as functions from 'firebase-functions';
import { adminDB, adminFV } from './config/firebase-settings';
import Document from './models/document';
import { getDocumentList } from './firestore';
import ChannelUser from './models/interfaces/channelUser';
import Message from './models/interfaces/message';

export const onCreateMessage = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .firestore.document('channels/{channelId}/messages/{messageId}')
  .onCreate(async (snapshot, { params: { channelId, messageId } }) => {
    console.log('onCreateMessage');

    const message = new Document<Message>(snapshot).data!;

    const channelUsers = await getDocumentList<ChannelUser>(
      `channels/${channelId}/users/`,
    );

    const batch = adminDB.batch();
    channelUsers.forEach((user) => {
      const userId = user.data!.id;

      let updateData;
      if (userId === message.senderId) {
        updateData = {
          lastMessage: message.message,
          date: adminFV.serverTimestamp(),
        };
      } else {
        updateData = {
          lastMessage: message.message,
          unreadCounter: adminFV.increment(1),
          date: adminFV.serverTimestamp(),
        };
      }

      batch.update(
        adminDB.doc(`users/${userId}/channels/${channelId}`),
        updateData,
      );
    });

    batch.update(adminDB.doc(`channels/${channelId}`), {
      lastMessageDate: adminFV.serverTimestamp(),
    });

    batch.commit();
  });

export const onUpdateReadStatus = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .firestore.document(
    'channels/{channelId}/messages/{messageId}/readStatus/{userId}',
  )
  .onUpdate(async (_snapshot, { params: { channelId, messageId, userId } }) => {
    console.log('onUpdateReadStatus');

    adminDB.doc(`channels/${channelId}/messages/${messageId}`).update({
      readCounter: adminFV.increment(1),
      readDate: adminFV.serverTimestamp(),
    });
  });
