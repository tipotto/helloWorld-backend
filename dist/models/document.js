"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Document {
    constructor(snapshot) {
        this.snapshot = snapshot;
    }
    get ref() {
        return this.snapshot.ref;
    }
    get data() {
        const data = this.snapshot.data();
        if (!data)
            return null;
        return data;
    }
}
exports.default = Document;
//# sourceMappingURL=document.js.map