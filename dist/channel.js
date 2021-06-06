"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSearchChannels = exports.onUnfollowOrDeleteChannel = exports.onUpdateChannel = exports.onCreateOrJoinChannel = void 0;
const functions = require("firebase-functions");
const firebase_tools = require('firebase-tools');
const firebase_settings_1 = require("./config/firebase-settings");
const document_1 = require("./models/document");
const firestore_1 = require("./firestore");
const translate_1 = require("./api/translate");
const algolia_1 = require("./config/algolia");
const createAlgoliaObject = async (channels, channelId) => {
    const updatedChannels = channels.map((channel) => (Object.assign(Object.assign({}, channel), { objectID: channelId + '-' + channel.id })));
    // 作成したobjectIdの配列を返す
    return algolia_1.index.saveObjects(updatedChannels);
};
const updateAlgoliaObject = async (channels, channelId) => {
    const updateChannels = channels.map(({ id, name, avatarLink, aboutChannel }) => ({
        name,
        avatarLink,
        aboutChannel,
        objectID: channelId + '-' + id,
    }));
    // 更新したobjectIdの配列を返す
    return algolia_1.index.partialUpdateObjects(updateChannels);
};
// const deleteSingleAlgoliaObject = async (
//   channel: ChannelRes,
//   channelId: string,
// ) => {
//   const objectId = channelId + '-' + channel.id;
//   // objectIdは返さないと思われる
//   return index.deleteObject(objectId);
// };
const deleteAlgoliaObjects = async (channels, channelId) => {
    const objectIds = channels.map((channel) => channelId + '-' + channel.data.id);
    // 削除したobjectIdの配列を返す
    return algolia_1.index.deleteObjects(objectIds);
};
const searchAlgoliaObjects = async (keyword, lang) => {
    const { hits } = await algolia_1.index.search(keyword, {
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
const createChannel = async (joiningCh, adminUser, channelId) => {
    console.log('createChannel');
    const userId = adminUser.id;
    const userLang = adminUser.lang;
    const userName = adminUser.name;
    const userAvatar = adminUser.avatarLink;
    const channelName = joiningCh.name;
    const channelAvatar = joiningCh.avatarLink;
    const aboutChannel = joiningCh.aboutChannel;
    let channels = [];
    channels.push({
        id: userLang,
        name: channelName,
        avatarLink: channelAvatar,
        aboutChannel,
        channelId,
    });
    console.log('userLang', userLang);
    // Channelの英訳
    if (userLang !== 'en') {
        const result = await translate_1.default.shared.translate([channelName, aboutChannel], 'en');
        channels.push({
            id: 'en',
            name: result[0],
            avatarLink: channelAvatar,
            aboutChannel: result[1],
            channelId,
        });
    }
    const batch = firebase_settings_1.adminDB.batch();
    // Channelの追加
    batch.set(firebase_settings_1.adminDB.doc(`channels/${channelId}`), {
        id: channelId,
        adminId: userId,
        memberCounter: 1,
        lastMessageDate: firebase_settings_1.adminFV.serverTimestamp(),
    });
    // ChannelRes（ユーザー言語・英語）の追加
    channels.forEach((channelRes) => {
        batch.set(firebase_settings_1.adminDB.doc(`channels/${channelId}/channelRes/${channelRes.id}`), channelRes);
    });
    // channelMemberの追加
    batch.set(firebase_settings_1.adminDB.doc(`channels/${channelId}/users/${userId}`), {
        id: userId,
        name: userName,
        lang: userLang,
        avatarLink: userAvatar,
    });
    batch.commit();
    // Algoliaのインデックス登録
    createAlgoliaObject(channels, channelId);
};
const joinChannel = async (joiningChannel, { id, name, avatarLink, lang }, channelId) => {
    console.log('joinChannel');
    const userLangChannelRes = await checkChannelResInUserLang(joiningChannel, lang, channelId);
    const batch = firebase_settings_1.adminDB.batch();
    // Channelの更新
    batch.update(firebase_settings_1.adminDB.doc(`channels/${channelId}`), {
        memberCounter: firebase_settings_1.adminFV.increment(1),
    });
    // ChannelRes（ユーザー言語）の追加
    if (userLangChannelRes) {
        batch.set(firebase_settings_1.adminDB.doc(`channels/${channelId}/channelRes/${lang}`), userLangChannelRes);
    }
    // channelMemberの追加
    batch.set(firebase_settings_1.adminDB.doc(`channels/${channelId}/users/${id}`), {
        id,
        name,
        lang,
        avatarLink,
    });
    batch.commit();
};
// Channelの作成・参加
exports.onCreateOrJoinChannel = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .firestore.document('users/{userId}/channels/{channelId}')
    .onCreate(async (snapshot, { params: { userId, channelId } }) => {
    console.log('onCreateOrJoinChannel');
    const joiningChannel = new document_1.default(snapshot).data;
    const user = (await firestore_1.getDocument(`users/${userId}`)).data;
    const channel = (await firestore_1.getDocument(`channels/${channelId}`)).data;
    if (!channel) {
        // チャンネルデータが存在しない場合
        createChannel(joiningChannel, user, channelId);
    }
    else {
        // チャンネルデータがすでに存在する場合
        joinChannel(joiningChannel, user, channelId);
    }
});
const checkChannelResInUserLang = async ({ name, avatarLink, aboutChannel }, userLang, channelId) => {
    console.log('checkChannelResInUserLang');
    let userLangChannelRes = (await firestore_1.getDocument(`channels/${channelId}/channelRes/${userLang}`)).data;
    if (userLangChannelRes)
        return null;
    userLangChannelRes = {
        id: userLang,
        name,
        avatarLink,
        aboutChannel,
        channelId,
    };
    // Algoliaのインデックス登録
    createAlgoliaObject([userLangChannelRes], channelId);
    return userLangChannelRes;
};
const checkJoiningChUpdate = (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.name === after.name &&
        before.aboutChannel === after.aboutChannel &&
        before.avatarLink === after.avatarLink) {
        return false;
    }
    return true;
};
// チャンネルの更新
exports.onUpdateChannel = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .firestore.document('users/{userId}/channels/{channelId}')
    .onUpdate(async (change, { params: { userId, channelId } }) => {
    console.log('onUpdateChannel');
    if (!checkJoiningChUpdate(change))
        return;
    const { name, aboutChannel, avatarLink } = change.after.data();
    // Adminユーザーの取得
    const adminUser = (await firestore_1.getDocument(`users/${userId}`)).data;
    // チャンネルメンバーの取得
    const channelUsers = await firestore_1.getDocumentList(`channels/${channelId}/users/`);
    // チャンネルユーザーからチャンネルの対応言語リストを取得する
    // 処理が面倒なので、サブコレクション（langs）として紐付けても良いかも
    const allUserLangs = channelUsers.map((user) => user.data.lang);
    const langsSet = new Set(allUserLangs);
    let langsArr = Array.from(langsSet);
    if (!langsArr.includes('en')) {
        langsArr.push('en');
    }
    const promises = langsArr.map(async (lang) => {
        // Channelの翻訳
        let result;
        if (lang !== adminUser.lang) {
            result = await translate_1.default.shared.translate([name, aboutChannel], lang);
        }
        else {
            result = [name, aboutChannel];
        }
        return {
            id: lang,
            name: result[0],
            avatarLink,
            aboutChannel: result[1],
            channelId,
        };
    });
    const channels = await Promise.all(promises);
    const batch = firebase_settings_1.adminDB.batch();
    // 既存の全ての言語のChannelResを更新（adminUserの言語以外）
    channels.forEach((channel) => {
        const { name, aboutChannel, avatarLink } = channel;
        batch.update(firebase_settings_1.adminDB.doc(`channels/${channelId}/channelRes/${channel.id}`), {
            name,
            aboutChannel,
            avatarLink,
        });
    });
    // チャンネルユーザーのJoiningChannelを更新
    channelUsers.forEach((member) => {
        const memberId = member.data.id;
        if (memberId === userId)
            return;
        batch.update(firebase_settings_1.adminDB.doc(`users/${memberId}/channels/${channelId}`), {
            name,
            aboutChannel,
            avatarLink,
        });
    });
    batch.commit();
    // Algoliaのデータ更新
    updateAlgoliaObject(channels, channelId);
});
const unfollowChannel = (userId, channelId) => {
    console.log('unfollowChannel');
    const batch = firebase_settings_1.adminDB.batch();
    // メンバー数をデクリメント
    batch.update(firebase_settings_1.adminDB.doc(`channels/${channelId}`), {
        memberCounter: firebase_settings_1.adminFV.increment(-1),
    });
    // channelMemberの削除
    batch.delete(firebase_settings_1.adminDB.doc(`channels/${channelId}/users/${userId}`));
    batch.commit();
};
const deleteChannel = async (userId, channelId) => {
    console.log('deleteChannel');
    // チャンネルメンバーの取得
    const channelUsers = await firestore_1.getDocumentList(`channels/${channelId}/users/`);
    const channelReses = await firestore_1.getDocumentList(`channels/${channelId}/channelRes/`);
    const batch = firebase_settings_1.adminDB.batch();
    // チャンネルユーザーのJoiningChannelを削除
    channelUsers.forEach((member) => {
        const memberId = member.data.id;
        if (memberId === userId)
            return;
        batch.delete(firebase_settings_1.adminDB.doc(`users/${memberId}/channels/${channelId}`));
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
    }
    catch (err) {
        console.error(err);
    }
    // AlgoliaのChannelResデータを削除
    deleteAlgoliaObjects(channelReses, channelId);
};
// Channelの退出・削除
exports.onUnfollowOrDeleteChannel = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .firestore.document('users/{userId}/channels/{channelId}')
    .onDelete(async (snapshot, { params: { userId, channelId } }) => {
    console.log('onUnfollowOrDeleteChannel');
    const { isAdmin } = snapshot.data();
    if (!isAdmin) {
        unfollowChannel(userId, channelId);
    }
    else {
        deleteChannel(userId, channelId);
    }
});
exports.onSearchChannels = functions
    .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
})
    .region('asia-northeast1')
    .https.onCall(async (data, context) => {
    console.log('onSearchChannels');
    // Only allow authenticated users to execute this function.
    if (!(context.auth && context.auth.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Must be an authenticated user to search channels.');
    }
    const keyword = data.keyword;
    const lang = data.lang;
    const userLang = data.userLang;
    console.log('keyword', keyword);
    console.log('lang', lang);
    console.log('userLang', userLang);
    // キーワードの言語検出
    // const lang = await Translate.shared.detectLang(keyword);
    // console.log('lang', lang);
    // Channel検索
    const results = (await searchAlgoliaObjects(keyword, lang));
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
//# sourceMappingURL=channel.js.map