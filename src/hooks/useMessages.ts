import { useState, useEffect } from 'react';

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

  const setTranslation = (messageId: string, translation: string) => {
    setTranslatedMessages(prev => ({
      ...prev,
      [messageId]: translation
    }));
  };

  return {
    messages,
    setMessages: setMessagesWithHistory,
    translatedMessages,
    setTranslatedMessages,
    addSystemMessage,
    addChatMessage,
    setTranslation
  };
} 