import * as functions from 'firebase-functions';
import Translate from './api/translate';

export const onTranslateTexts = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    console.log('onTranslateTexts');

    // Only allow authenticated users to execute this function.
    if (!(context.auth && context.auth.uid)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must be an authenticated user to translate texts.',
      );
    }

    const transTexts = data.transTexts as string[];
    const transLang = data.transLang as string;

    return Translate.shared.translate(transTexts, transLang);
  });

export const onFetchSupportedLangs = functions
  .runWith({
    timeoutSeconds: 240,
    memory: '1GB',
  })
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    console.log('onFetchSupportedLangs');

    // Only allow authenticated users to execute this function.
    if (!(context.auth && context.auth.uid)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must be an authenticated user to translate texts.',
      );
    }

    const userLang = data.userLang as string;
    return Translate.shared.fetchSupportedLangs(userLang);
  });

// メッセージの個別翻訳、複数翻訳のどちらにも利用可能
// 個別翻訳: listenForNewChatsメソッド etc.
// 結果取得後はクライアント側で、Without Notificationの状態でRealmに保存する
// そのため、翻訳前のmessageと翻訳済みテキストは別で取得する必要あり
// 複数翻訳: translateInNewLangメソッド etc.
// isFirstQueryの場合は個別翻訳と同様のフローで問題ない
// 2回目以降の翻訳時は、Realmにメッセージを事前に保存しないため
// メッセージを新規作成し、Without Notificationの状態でRealmに保存する
// 元々のメッセージを翻訳済みテキストで更新しようとすると、
// Realmトランザクション外での更新となりエラーが発生するため、新規作成することで対応

// const getTransResult = (
//   transText: string,
//   index: number,
//   isRealmNotified: boolean,
//   filteredMsgs: Message[],
// ) => {
//   console.log('getTransResult');

//   if (isRealmNotified) {
//     return {
//       message: filteredMsgs[index],
//       transText,
//     } as TranslateResult;
//   }

//   return {
//     message: { ...filteredMsgs[index], message: transText },
//     transText: '',
//   } as TranslateResult;
// };

// export const onTranslateMessages = functions
//   .runWith({
//     timeoutSeconds: 240,
//     memory: '1GB',
//   })
//   .region('asia-northeast1')
//   .https.onCall(async (data, context) => {
//     console.log('onTranslateMessages');

//     // Only allow authenticated users to execute this function.
//     if (!(context.auth && context.auth.uid)) {
//       throw new functions.https.HttpsError(
//         'permission-denied',
//         'Must be an authenticated user to translate texts.',
//       );
//     }

//     const messages = data.messages as Message[];
//     const transLang = data.transLang as string;
//     const isRealmNotified = data.isRealmNotified as boolean;

//     const filteredMsgs = messages.filter(
//       (message) => message.senderLang !== transLang,
//     );

//     const msgTexts = [...filteredMsgs].map((message) => message.message);
//     const transTexts = await Translate.shared.translate(msgTexts, transLang);

//     const results = transTexts.map((transText, index) => {
//       return getTransResult(transText, index, isRealmNotified, filteredMsgs);
//     });

//     console.log('results:', results);

//     return results;

//     // return transTexts.map((transText, index) => {
//     //   return getTransResult(transText, index, isRealmNotified, filteredMsgs);
//     // });
//   });
