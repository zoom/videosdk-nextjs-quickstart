export interface TranslationConfig {
  languages: {
    [key: string]: {
      code: string;
      name: string;
      systemPrompt: string;
    };
  };
  defaultSourceLang: string;
}

export const translationConfig: TranslationConfig = {
  languages: {
    none: {
      code: 'none',
      name: '不翻譯',
      systemPrompt: '',
    },
    vi: {
      code: 'vi',
      name: '越南文',
      systemPrompt: 'You are a translator. Translate the following Traditional Chinese messages into Vietnamese. Only return the translated array in valid JSON format, nothing else.',
    },
    zh: {
      code: 'zh',
      name: '繁體中文',
      systemPrompt: 'You are a translator. Translate the following Vietnamese messages into Traditional Chinese. Only return the translated array in valid JSON format, nothing else.',
    },
  },
  defaultSourceLang: 'none',
};

export const getApiConfig = () => {
  const apiUrl = process.env.NEXT_PUBLIC_TRANSLATION_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_TRANSLATION_API_KEY;

  return {
    apiUrl,
    apiKey
  };
}; 