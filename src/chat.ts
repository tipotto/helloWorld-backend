import * as functions from 'firebase-functions';
const firebase_tools = require('firebase-tools');
import { adminDB, adminFV } from './config/firebase-settings';
import Document from './models/document';
import { getDocument, getDocumentList } from './firestore';
import Channel from './models/interfaces/channel';
import ChannelRes from './models/interfaces/channelRes';
import JoiningChannel from './models/interfaces/joiningChannel';
import User from './models/interfaces/user';
import ChannelUser from './models/interfaces/channelUser';
import Translate from './api/translate';
import { index } from './config/algolia';

const createAlgoliaObject = async (
  channels: ChannelRes[],
  channelId: string,
) => {
  const updatedChannels = channels.map((channel) => ({
    ...channel,
    objectID: channelId + '-' + channel.id,
  }));

  // 作成したobjectIdの配列を返す
  return index.saveObjects(updatedChannels);
};

const updateAlgoliaObject = async (
  channels: ChannelRes[],
  channelId: string,
) => {
  const updateChannels = channels.map(
    ({ id, name, avatarLink, aboutChannel }) => ({
      name,
      avatarLink,
      aboutChannel,
      objectID: channelId + '-' + id,
    }),
  );

  // 更新したobjectIdの配列を返す
  return index.partialUpdateObjects(updateChannels);
};

// const deleteSingleAlgoliaObject = async (
//   channel: ChannelRes,
//   channelId: string,
// ) => {
//   const objectId = channelId + '-' + channel.id;

//   // objectIdは返さないと思われる
//   return index.deleteObject(objectId);
// };

const deleteAlgoliaObjects = async (
  channels: Document<ChannelRes>[],
  channelId: string,
) => {
  const objectIds = channels.map(
    (channel) => channelId + '-' + channel.data!.id,
  );

  // 削除したobjectIdの配列を返す
  return index.deleteObjects(objectIds);
};

const searchAlgoliaObjects = async (keyword: string, lang: string) => {
  const { hits } = await index.search(keyword, {
    // TODO: ユーザー言語 or 英語、どちらの検索なのかを判断してフィルターをかける
    filters: `id:${lang}`,
    attributesToRetrieve: [
      'id',
      'name',
      'avatarLink',
      'aboutChannel',
      'channelId',
    ],
    hitsPerPage: 50,
  });

  return hits;
};

// const searchForFacets = async (keyword: string, userLang: string) => {
//   const { hits } = await index.search(keyword, {
//     filters: `id:${userLang}`,
//     facets: ['name'],
//   });

//   return hits;
// };

// const searchForFacets = async (keyword: string, userLang: string) => {
//   const { facetHits } = await index.searchForFacetValues('name', keyword, {
//     filters: `id:${userLang}`,
//   });

//   return facetHits;
// };

const createChannel = async (
  joiningCh: JoiningChannel,
  adminUser: User,
  channelId: string,
) => {
  console.log('createChannel');

  const userId = adminUser.id;
  const userLang = adminUser.lang;
  const userName = adminUser.name;
  const userAvatar = adminUser.avatarLink;
  const channelName = joiningCh.name;
  const channelAvatar = joiningCh.avatarLink;
  const aboutChannel = joiningCh.aboutChannel;

  let channels: ChannelRes[] = [];
  channels.push({
    id: userLang,
    name: channelName,
    avatarLink: channelAvatar,
    aboutChannel,
    channelId,
  } as ChannelRes);

  console.log('userLang', userLang);

  // Channelの英訳
  if (userLang !== 'en') {
    const result = await Translate.shared.translate(
      [channelName, aboutChannel],
      'en',
    );

    channels.push({
      id: 'en',
      name: result[0],
      avatarLink: channelAvatar,
      aboutChannel: result[1],
      channelId,
    } as ChannelRes);
  }

  const batch = adminDB.batch();

  // Channelの追加
  batch.set(adminDB.doc(`channels/${channelId}`), {
    id: channelId,
    adminId: userId,
    memberCounter: 1,
    lastMessageDate: adminFV.serverTimestamp(),
  } as Channel);

  // ChannelRes（ユーザー言語・英語）の追加
  channels.forEach((channelRes) => {
    batch.set(
      adminDB.doc(`channels/${channelId}/channelRes/${channelRes.id}`),
      channelRes,
    );
  });

  // channelMemberの追加
  batch.set(adminDB.doc(`channels/${channelId}/users/${userId}`), {
    id: userId,
    name: userName,
    lang: userLang,
    avatarLink: userAvatar,
  } as ChannelUser);

  batch.commit();

  // Algoliaのインデックス登録
  createAlgoliaObject(channels, channelId);
};

const joinChannel = async (
  joiningChannel: JoiningChannel,
  { id, name, avatarLink, lang }: User,
  channelId: string,
) => {
  console.log('joinChannel');

  const userLangChannelRes = await checkChannelResInUserLang(
    joiningChannel,
    lang,
    channelId,
  );

  const batch = adminDB.batch();

  // Channelの更新
  batch.update(adminDB.doc(`channels/${channelId}`), {
    memberCounter: adminFV.increment(1),
  });

  // ChannelRes（ユーザー言語）の追加
  if (userLangChannelRes) {
    batch.set(
      adminDB.doc(`channels/${channelId}/channelRes/${lang}`),
      userLangChannelRes,
    );
  }

  // channelMemberの追加
  batch.set(adminDB.doc(`channels/${channelId}/users/${id}`), {
    id,
    name,
    lang,
    avatarLink,
  } as ChannelUser);

  batch.commit();
};

// Channelの作成・参加
export const onCreateOrJoinChannel = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .firestore.document('users/{userId}/channels/{channelId}')
  .onCreate(async (snapshot, { params: { userId, channelId } }) => {
    console.log('onCreateOrJoinChannel');

    const joiningChannel = new Document<JoiningChannel>(snapshot).data!;
    const user = (await getDocument<User>(`users/${userId}`)).data!;
    const channel = (await getDocument<Channel>(`channels/${channelId}`)).data;

    if (!channel) {
      // チャンネルデータが存在しない場合
      createChannel(joiningChannel, user, channelId);
    } else {
      // チャンネルデータがすでに存在する場合
      joinChannel(joiningChannel, user, channelId);
    }
  });

const checkChannelResInUserLang = async (
  { name, avatarLink, aboutChannel }: JoiningChannel,
  userLang: string,
  channelId: string,
): Promise<ChannelRes | null> => {
  console.log('checkChannelResInUserLang');

  let userLangChannelRes = (
    await getDocument<ChannelRes>(
      `channels/${channelId}/channelRes/${userLang}`,
    )
  ).data;

  if (userLangChannelRes) return null;

  userLangChannelRes = {
    id: userLang,
    name,
    avatarLink,
    aboutChannel,
    channelId,
  } as ChannelRes;

  // Algoliaのインデックス登録
  createAlgoliaObject([userLangChannelRes], channelId);

  return userLangChannelRes;
};

const checkJoiningChUpdate = (
  change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
) => {
  const before = change.before.data()!;
  const after = change.after.data()!;

  if (
    before.name === after.name &&
    before.aboutChannel === after.aboutChannel &&
    before.avatarLink === after.avatarLink
  ) {
    return false;
  }

  return true;
};

// チャンネルの更新
export const onUpdateChannel = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .firestore.document('users/{userId}/channels/{channelId}')
  .onUpdate(async (change, { params: { userId, channelId } }) => {
    console.log('onUpdateChannel');

    if (!checkJoiningChUpdate(change)) return;

    const { name, aboutChannel, avatarLink } = change.after.data()!;

    // Adminユーザーの取得
    const adminUser = (await getDocument<User>(`users/${userId}`)).data!;

    // チャンネルメンバーの取得
    const channelUsers = await getDocumentList<ChannelUser>(
      `channels/${channelId}/users/`,
    );

    // チャンネルユーザーからチャンネルの対応言語リストを取得する
    // 処理が面倒なので、サブコレクション（langs）として紐付けても良いかも
    const allUserLangs = channelUsers.map((user) => user.data!.lang);
    const langsSet = new Set(allUserLangs);
    let langsArr = Array.from(langsSet);

    if (!langsArr.includes('en')) {
      langsArr.push('en');
    }

    const promises = langsArr.map(async (lang) => {
      // Channelの翻訳
      let result: string[];
      if (lang !== adminUser.lang) {
        result = await Translate.shared.translate([name, aboutChannel], lang);
      } else {
        result = [name, aboutChannel];
      }

      return {
        id: lang,
        name: result[0],
        avatarLink,
        aboutChannel: result[1],
        channelId,
      } as ChannelRes;
    });

    const channels = await Promise.all(promises);

    const batch = adminDB.batch();

    // 既存の全ての言語のChannelResを更新（adminUserの言語以外）
    channels.forEach((channel) => {
      const { name, aboutChannel, avatarLink } = channel;
      batch.update(
        adminDB.doc(`channels/${channelId}/channelRes/${channel.id}`),
        {
          name,
          aboutChannel,
          avatarLink,
        },
      );
    });

    // チャンネルユーザーのJoiningChannelを更新
    channelUsers.forEach((member) => {
      const memberId = member.data!.id;
      if (memberId === userId) return;

      batch.update(adminDB.doc(`users/${memberId}/channels/${channelId}`), {
        name,
        aboutChannel,
        avatarLink,
      });
    });

    batch.commit();

    // Algoliaのデータ更新
    updateAlgoliaObject(channels, channelId);
  });

const unfollowChannel = (userId: string, channelId: string) => {
  console.log('unfollowChannel');

  const batch = adminDB.batch();

  // メンバー数をデクリメント
  batch.update(adminDB.doc(`channels/${channelId}`), {
    memberCounter: adminFV.increment(-1),
  });

  // channelMemberの削除
  batch.delete(adminDB.doc(`channels/${channelId}/users/${userId}`));

  batch.commit();
};

const deleteChannel = async (userId: string, channelId: string) => {
  console.log('deleteChannel');

  // チャンネルメンバーの取得
  const channelUsers = await getDocumentList<ChannelUser>(
    `channels/${channelId}/users/`,
  );

  const channelReses = await getDocumentList<ChannelRes>(
    `channels/${channelId}/channelRes/`,
  );

  const batch = adminDB.batch();

  // チャンネルユーザーのJoiningChannelを削除
  channelUsers.forEach((member) => {
    const memberId = member.data!.id;
    if (memberId === userId) return;

    batch.delete(adminDB.doc(`users/${memberId}/channels/${channelId}`));
  });

  batch.commit();

  console.log('project env', process.env.FIREBASE_PROJECT_ID);

  // チャンネルを再帰的に削除
  // channels, channelRes, users, messages, readStatus
  try {
    await firebase_tools.firestore.delete(`channels/${channelId}`, {
      project: functions.config().fb.project,
      recursive: true,
      yes: true,
      token: functions.config().fb.token,
    });
  } catch (err) {
    console.error(err);
  }

  // AlgoliaのChannelResデータを削除
  deleteAlgoliaObjects(channelReses, channelId);
};

// Channelの退出・削除
export const onUnfollowOrDeleteChannel = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .firestore.document('users/{userId}/channels/{channelId}')
  .onDelete(async (snapshot, { params: { userId, channelId } }) => {
    console.log('onUnfollowOrDeleteChannel');

    const { isAdmin } = snapshot.data() as JoiningChannel;

    if (!isAdmin) {
      unfollowChannel(userId, channelId);
    } else {
      deleteChannel(userId, channelId);
    }
  });

export const onSearchChannels = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    console.log('onSearchChannels');

    // Only allow authenticated users to execute this function.
    if (!(context.auth && context.auth.uid)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must be an authenticated user to search channels.',
      );
    }

    const keyword = data.keyword as string;
    const lang = data.lang as string;
    const userLang = data.userLang as string;

    console.log('keyword', keyword);
    console.log('lang', lang);
    console.log('userLang', userLang);

    // キーワードの言語検出
    // const lang = await Translate.shared.detectLang(keyword);
    // console.log('lang', lang);

    // Channel検索
    const results = (await searchAlgoliaObjects(keyword, lang)) as ChannelRes[];

    // const results = searchResults.map(
    //   (result) =>
    //     ({
    //       id: result.id,
    //       name: result.name,
    //       avatarLink: result.avatarLink,
    //       aboutChannel: result.aboutChannel,
    //       channelId: result.channelId,
    //     } as ChannelRes),
    // );

    console.log('results', results);

    return {
      results,
      isTransNeeded: results.length > 0 && lang !== userLang ? true : false,
    };
  });

// export const onSearchFacets = functions
//   .runWith({
//     timeoutSeconds: 240,
//     memory: '1GB',
//   })
//   .region('asia-northeast1')
//   .https.onCall(async (data, context) => {
//     console.log('onSearchFacets');

//     // Only allow authenticated users to execute this function.
//     if (!(context.auth && context.auth.uid)) {
//       throw new functions.https.HttpsError(
//         'permission-denied',
//         'Must be an authenticated user to search channels.',
//       );
//     }

//     const keyword = data.keyword as string;
//     const userLang = data.userLang as string;

//     console.log('keyword', keyword);
//     console.log('userLang', userLang);

//     // Channel検索
//     const results = await searchForFacets(keyword, userLang);
//     console.log('Facets results', results);

//     return { results };
//   });
