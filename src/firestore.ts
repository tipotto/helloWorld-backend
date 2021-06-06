import { adminDB } from './config/firebase-settings';
import Document from './models/document';

export const getDocument = async <T>(
  documentPath: string,
): Promise<Document<T>> => {
  return adminDB
    .doc(documentPath)
    .get()
    .then((s) => new Document<T>(s));
};

export const getDocumentList = async <T>(
  collectionPath: string,
): Promise<Document<T>[]> => {
  return adminDB
    .collection(collectionPath)
    .get()
    .then((querySnaps) => {
      const docSnaps = querySnaps.docs;
      return docSnaps.map((s) => new Document<T>(s));
    });
};
