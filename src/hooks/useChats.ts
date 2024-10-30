import { useState, useEffect } from 'react';

import { ChatMessage } from '@/types/chat';

export function useChats() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('translatedMessages');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const systemMessages = messages.filter(msg => msg.isSystem);
    localStorage.setItem('systemMessages', JSON.stringify(systemMessages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('translatedMessages', JSON.stringify(translatedMessages));
  }, [translatedMessages]);

  const setMessagesWithHistory = (newMessages: ChatMessage[]) => {
    const savedSystemMessages = localStorage.getItem('systemMessages');
    const systemMessages = savedSystemMessages ? JSON.parse(savedSystemMessages) : [];
    
    const mergedMessages = [...systemMessages, ...newMessages.filter(msg => !msg.isSystem)];
    
    mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    setMessages(mergedMessages);
  };

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

  return {
    messages,
    setMessages: setMessagesWithHistory,
    translatedMessages,
    setTranslatedMessages,
    addSystemMessage,
    addChatMessage
  };
} 