import { useState, useEffect } from 'react';

import { ChatMessage, FileMessage } from '@/types/chat';

export function useChats() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const systemMessages = messages.filter(msg => msg.isSystem);
    localStorage.setItem('systemMessages', JSON.stringify(systemMessages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('translatedMessages', JSON.stringify(translatedMessages));
  }, [translatedMessages]);

  const addSystemMessage = (message: string) => {
    const systemMessage: FileMessage = {
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

  const addChatMessage = (newChatMessage: FileMessage) => {
    setMessages(prev => {
      const isDuplicate = prev.some(msg => msg.id === newChatMessage.id);
      if (isDuplicate) return prev;
      return [...prev, newChatMessage];
    });
  };

  return {
    messages,
    setMessages,
    translatedMessages,
    setTranslatedMessages,
    addSystemMessage,
    addChatMessage
  };
} 