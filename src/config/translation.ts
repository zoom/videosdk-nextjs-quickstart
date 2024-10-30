// 定義有效的翻譯語言（不包含 'none'）
export type TranslationLanguage = 'vi' | 'zh';

// 定義所有語言（包含 'none'）
export type AllLanguages = TranslationLanguage | 'none';

// 定義語言設定的介面
export interface LanguageConfig {
  code: AllLanguages;
  name: string;
  displayName: string;
  systemPrompt: string;
}

// 定義設定檔的介面
export interface TranslationConfigType {
  languages: Record<AllLanguages, LanguageConfig>;
  defaultSourceLang: AllLanguages;
}

// 實際的設定檔
export const translationConfig: TranslationConfigType = {
  languages: {
    none: {
      code: 'none',
      name: '不翻譯',
      displayName: '關閉翻譯',
      systemPrompt: '',
    },
    vi: {
      code: 'vi',
      name: '越南文',
      displayName: '翻譯成越南文',
      systemPrompt: 'You are a translator. Your task is to: 1) If the input is in Vietnamese, return it unchanged. 2) For any other language, translate it into Vietnamese. Only return the translated array in valid JSON format, nothing else. Never translate Vietnamese text into other languages.',
    },
    zh: {
      code: 'zh',
      name: '中文',
      displayName: '翻譯成中文',
      systemPrompt: 'You are a translator. Your task is to: 1) If the input is in Traditional Chinese, return it unchanged. 2) For any other language, translate it into Traditional Chinese. Only return the translated array in valid JSON format, nothing else. Never translate Traditional Chinese text into other languages.',
    },
  },
  defaultSourceLang: 'none',
} as const;

export const getApiConfig = () => {
  const apiUrl = process.env.NEXT_PUBLIC_TRANSLATION_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_TRANSLATION_API_KEY;

  return {
    apiUrl,
    apiKey
  };
}; 