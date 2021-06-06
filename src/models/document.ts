export default class Document<T> {
  private snapshot: FirebaseFirestore.DocumentSnapshot;

  constructor(snapshot: FirebaseFirestore.DocumentSnapshot) {
    this.snapshot = snapshot;
  }

  get ref(): FirebaseFirestore.DocumentReference {
    return this.snapshot.ref;
  }
  get data(): T | null {
    const data = this.snapshot.data();
    if (!data) return null;
    return data as T;
  }
}
