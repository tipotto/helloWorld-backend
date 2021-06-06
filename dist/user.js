"use strict";
// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
// import { db, FieldValue } from './config/firebase.settings';
// export const onCreateUser = functions
//   .region('asia-northeast1')
//   .auth.user()
//   .onCreate(async (user) => {
//     // アカウント凍結状態の初期設定
//     await admin.auth().setCustomUserClaims(user.uid, {
//       suspended: false,
//     });
//     // カスタムクレームの初期化が完了してからユーザー情報を作成
//     const batch = db.batch();
//     batch.set(db.doc(`users/${user.uid}`)), {};
//   });
//# sourceMappingURL=user.js.map