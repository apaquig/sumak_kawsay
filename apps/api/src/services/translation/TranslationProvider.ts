export interface TranslatableProduct {
  name: string;
  shortDescription: string;
  description: string;
  materials: string;
  technique: string;
  careInstructions: string;
  seoTitle: string;
  seoDescription: string;
}

export interface TranslationProvider {
  translateText(text: string, source: 'es', target: 'en'): Promise<string>;
  translateProduct(product: TranslatableProduct): Promise<TranslatableProduct>;
}
