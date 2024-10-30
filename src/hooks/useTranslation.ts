import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { translationConfig, getApiConfig } from '@/config/translation';

export type TranslationLanguage = keyof typeof translationConfig.languages;

interface UseTranslationProps {
  addSystemMessage: (message: string) => void;
}

export const useTranslation = ({ addSystemMessage }: UseTranslationProps) => {
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>(() => {
    // 從 localStorage 讀取已翻譯的訊息
    const saved = localStorage.getItem('translatedMessages');
    return saved ? JSON.parse(saved) : {};
  });

  // 當翻譯訊息更新時，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('translatedMessages', JSON.stringify(translatedMessages));
  }, [translatedMessages]);

  const [autoTranslateLanguage, setAutoTranslateLanguage] = useState<TranslationLanguage>(translationConfig.defaultSourceLang as TranslationLanguage);

  const handleAutoTranslateLanguageChange = (language: TranslationLanguage) => {
    setAutoTranslateLanguage(language);
    if (language === 'none') {
      setTranslatedMessages({});
    }
  };

  const translateMessages = async (
    messages: string[], 
    targetLang: TranslationLanguage
  ) => {
    const { apiUrl, apiKey } = getApiConfig();
    
    if (!apiUrl) {
      console.error('API URL 未設置');
      return null;
    }
    
    if (!apiKey) {
      console.error('API Key 未設置');
      return null;
    }

    if (!translationConfig.languages[targetLang]) {
      console.error(`不支援的語言: ${targetLang}`);
      return null;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: translationConfig.languages[targetLang].systemPrompt
            },
            {
              role: "user",
              content: JSON.stringify(messages)
            }
          ],
          temperature: 0.3,
          top_p: 0.3,
          max_tokens: 2000,
          stream: false
        })
      });

      const data = await response.json();
      let cleanContent = data.choices[0].message.content;
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON 解析失敗:', parseError);
        return null;
      }
    } catch (error) {
      console.error('翻譯失敗:', error);
      return null;
    }
  };

  const handleTranslate = async (
    messages: ChatMessage[], 
    targetLang: TranslationLanguage
  ) => {
    try {
      const messagesToTranslate = messages
        .filter(msg => !msg.isSystem)
        .map(msg => msg.message);

      if (messagesToTranslate.length === 0) {
        addSystemMessage('沒有可翻譯的訊息');
        return;
      }

      addSystemMessage(`正在${translationConfig.languages[targetLang].displayName}...`);
      const translations = await translateMessages(messagesToTranslate, targetLang);
      
      if (translations && Array.isArray(translations)) {
        const newTranslations: Record<string, string> = {};
        messages
          .filter(msg => !msg.isSystem)
          .forEach((msg, index) => {
            if (translations[index]) {
              newTranslations[msg.id] = translations[index];
            }
          });
        
        setTranslatedMessages(newTranslations);
        addSystemMessage('翻譯完成');
        return true;
      } else {
        addSystemMessage('翻譯失敗，請稍後再試');
        return false;
      }
    } catch (error) {
      console.error('翻譯處理失敗:', error);
      addSystemMessage('翻譯處理失敗');
      return false;
    }
  };

  const setTranslation = (messageId: string, translation: string) => {
    setTranslatedMessages(prev => ({
      ...prev,
      [messageId]: translation
    }));
  };

  return {
    translatedMessages,
    setTranslatedMessages,
    autoTranslateLanguage,
    setAutoTranslateLanguage: handleAutoTranslateLanguageChange,
    translateMessages,
    handleTranslate,
    setTranslation
  };
};