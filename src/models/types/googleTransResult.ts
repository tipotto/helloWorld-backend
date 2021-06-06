export type googleTransResultKey = 'translatedText' | 'detectedSourceLanguage';

export type googleTransResult = {
  [key in googleTransResultKey]: string;
};
