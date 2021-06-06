const { Translate: GoogleTranslate } = require('@google-cloud/translate').v2;
import { GoogleDetectLangResult } from 'models/types/googleDetectLangResult';

export default class Translate {
  static shared = new Translate();
  trans: any;

  constructor() {
    console.log('constructor');
    this.trans = new GoogleTranslate();
  }

  async fetchSupportedLangs(userLang: string) {
    console.log('fetchSupportedLangs');

    const [languages] = await this.trans.getLanguages(userLang);
    console.log('Supported Langs', languages);
    return languages;
  }

  async detectLang(text: string): Promise<string> {
    console.log('detectLang');

    let [result] = await this.trans.detect(text);
    console.log('Detected lang', result);
    return (result as GoogleDetectLangResult).language;
  }

  async translate(textArr: string[], transLang: string): Promise<string[]> {
    console.log('translate');

    const options = { to: transLang };

    let result = await this.trans.translate(textArr, options);
    console.log('translate result', result);
    return result as string[];
  }
}
