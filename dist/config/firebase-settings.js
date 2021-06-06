"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFV = exports.adminDB = void 0;
const firebase_1 = require("firebase");
const admin = require("firebase-admin");
const serviceAccount = require('../admin_cert.json');
const firebaseConfig = {
    apiKey: 'AIzaSyCbvsQ2mqzN_AjLad5SntMZpA8OHxUmb9M',
    authDomain: 'helloworld-2ff85.firebaseapp.com',
    databaseURL: 'https://helloworld-2ff85-default-rtdb.firebaseio.com',
    projectId: 'helloworld-2ff85',
    storageBucket: 'helloworld-2ff85.appspot.com',
    messagingSenderId: '153922782199',
    appId: '1:153922782199:web:9c6466e5798e0d5f15a4f2',
    measurementId: 'G-LB0N58VKQP',
};
firebase_1.default.initializeApp(firebaseConfig);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: 'https://helloworld-2ff85-default-rtdb.firebaseio.com',
// });
// const db = firebase.firestore();
const adminDB = admin.firestore();
exports.adminDB = adminDB;
const adminFV = admin.firestore.FieldValue;
exports.adminFV = adminFV;
//# sourceMappingURL=firebase-settings.js.map