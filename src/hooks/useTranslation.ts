import { useState } from 'react';
import { ChatMessage } from '@/types/chat';

export type TranslationLanguage = 'none' | 'vi' | 'zh';

interface UseTranslationProps {
  addSystemMessage: (message: string) => void;
}

export const useTranslation = ({ addSystemMessage }: UseTranslationProps) => {
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [autoTranslateLanguage, setAutoTranslateLanguage] = useState<TranslationLanguage>('none');

  const handleAutoTranslateLanguageChange = (language: TranslationLanguage) => {
    setAutoTranslateLanguage(language);
    if (language === 'none') {
      setTranslatedMessages({});
    }
  };

  const translateMessages = async (messages: string[], targetLang: 'vi' | 'zh') => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      if (!apiUrl || !apiKey) {
        console.error('翻譯 API 設定缺失');
        return null;
      }

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
              content: targetLang === 'vi' 
                ? "You are a translator. Translate the following Traditional Chinese messages into Vietnamese. Only return the translated array in valid JSON format, nothing else."
                : "You are a translator. Translate the following Vietnamese messages into Traditional Chinese. Only return the translated array in valid JSON format, nothing else."
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

  const handleTranslate = async (messages: ChatMessage[], targetLang: 'vi' | 'zh') => {
    try {
      const messagesToTranslate = messages
        .filter(msg => !msg.isSystem)
        .map(msg => msg.message);

      if (messagesToTranslate.length === 0) {
        addSystemMessage('沒有可翻譯的訊息');
        return;
      }

      addSystemMessage('正在翻譯訊息...');
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
        addSystemMessage('訊息翻譯完成');
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