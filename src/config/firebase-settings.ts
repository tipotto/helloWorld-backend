import firebase from 'firebase';
import * as admin from 'firebase-admin';
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

firebase.initializeApp(firebaseConfig);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: 'https://helloworld-2ff85-default-rtdb.firebaseio.com',
// });

// const db = firebase.firestore();
const adminDB = admin.firestore();
const adminFV = admin.firestore.FieldValue;
// const fieldValue = firebase.firestore.FieldValue;

export { adminDB, adminFV };
