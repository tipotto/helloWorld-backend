"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Translate: GoogleTranslate } = require('@google-cloud/translate').v2;
class Translate {
    constructor() {
        console.log('constructor');
        this.trans = new GoogleTranslate();
    }
    async fetchSupportedLangs(userLang) {
        console.log('fetchSupportedLangs');
        const [languages] = await this.trans.getLanguages(userLang);
        console.log('Supported Langs', languages);
        return languages;
    }
    async detectLang(text) {
        console.log('detectLang');
        let [result] = await this.trans.detect(text);
        console.log('Detected lang', result);
        return result.language;
    }
    async translate(textArr, transLang) {
        console.log('translate');
        const options = { to: transLang };
        let result = await this.trans.translate(textArr, options);
        console.log('translate result', result);
        return result;
    }
}
exports.default = Translate;
Translate.shared = new Translate();
//# sourceMappingURL=translate.js.map