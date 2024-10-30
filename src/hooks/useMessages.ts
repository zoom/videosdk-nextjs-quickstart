import { useState } from 'react';

interface FileInfo {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
  receiverId?: number;
  isSystem?: boolean;
  file?: FileInfo;
}

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}-${Math.random()}`,
      senderId: 0,
      senderName: '系統訊息',
      message,
      timestamp: Date.now(),
      isPrivate: false,
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const addChatMessage = (newChatMessage: ChatMessage) => {
    setMessages(prev => {
      const isDuplicate = prev.some(msg => msg.id === newChatMessage.id);
      if (isDuplicate) return prev;
      return [...prev, newChatMessage];
    });
  };

  const setTranslation = (messageId: string, translation: string) => {
    setTranslatedMessages(prev => ({
      ...prev,
      [messageId]: translation
    }));
  };

  return {
    messages,
    setMessages,
    translatedMessages,
    setTranslatedMessages,
    addSystemMessage,
    addChatMessage,
    setTranslation
  };
} 