import type { TranslatableProduct, TranslationProvider } from './TranslationProvider.js';

const protectedTerms = [
  'Sumak Kawsay',
  'Saraguro',
  'Loja',
  'Ecuador',
];

export class LibreTranslateProvider implements TranslationProvider {
  constructor(private readonly baseUrl: string, private readonly apiKey?: string) {}

  async translateText(text: string, source: 'es', target: 'en') {
    if (!text.trim()) return '';
    const { protectedText, replacements } = protectTerms(text);
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: protectedText, source, target, format: 'text', ...(this.apiKey ? { api_key: this.apiKey } : {}) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`LibreTranslate responded with ${response.status}`);
    const data = await response.json() as { translatedText?: string };
    if (!data.translatedText) throw new Error('LibreTranslate returned an empty translation');
    return restoreTerms(data.translatedText, replacements);
  }

  async translateProduct(product: TranslatableProduct) {
    const result = {} as TranslatableProduct;
    for (const key of Object.keys(product) as (keyof TranslatableProduct)[]) {
      result[key] = await this.translateText(product[key], 'es', 'en');
    }
    return result;
  }
}

function protectTerms(text: string) {
  const replacements = new Map<string, string>();
  let protectedText = text;
  protectedTerms.forEach((term, index) => {
    const token = `ZXQTERM${index}QXZ`;
    if (protectedText.includes(term)) {
      replacements.set(token, term);
      protectedText = protectedText.split(term).join(token);
    }
  });
  return { protectedText, replacements };
}

function restoreTerms(text: string, replacements: Map<string, string>) {
  let restored = text;
  replacements.forEach((term, token) => {
    restored = restored.split(token).join(term);
    restored = restored.split(token.toLowerCase()).join(term);
  });
  return restored;
}
