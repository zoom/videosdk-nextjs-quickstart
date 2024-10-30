import { useState, useEffect } from 'react';

import { ChatMessage } from '@/types/chat';

interface FileMessage extends ChatMessage {
  fileInfo?: {
    name: string;
    size: number;
    url: string;
  };
}

export function useChats() {
  const [messages, setMessages] = useState<FileMessage[]>([]);
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

  const sendFile = async (
    chatClient: any,
    file: File,
    receiver: 'all' | number = 'all',
    allUsers: any[] = [],
    currentUser: any
  ) => {
    try {
      const otherUsers = allUsers.filter(user => user.userId !== currentUser?.userId);
      if (otherUsers.length === 0) {
        throw new Error('沒有其他參與者可以傳送檔案');
      }

      if (file.size > 30 * 1024 * 1024) {
        throw new Error('檔案大小不能超過 30MB');
      }

      if (receiver === 'all') {
        for (const user of otherUsers) {
          await chatClient.sendFile(file, user.userId);
        }
      } else {
        await chatClient.sendFile(file, receiver);
      }

      const history = await chatClient.getHistory();
      const formattedHistory = history.map((msg: any) => {
        const baseMessage = {
          id: `history-${msg.timestamp}-${msg.sender.userId}`,
          senderId: msg.sender.userId,
          senderName: msg.sender.name || '未知用戶',
          message: msg.message || (msg.file ? `已發送檔案: ${msg.file.name}` : ''),
          timestamp: msg.timestamp,
          isPrivate: !!msg.receiver && msg.receiver.userId !== 0,
          receiverId: msg.receiver?.userId === 0 ? undefined : msg.receiver?.userId,
          isSystem: false
        };

        if (msg.file) {
          return {
            ...baseMessage,
            fileInfo: {
              name: msg.file.name,
              size: msg.file.size,
              url: msg.file.fileUrl
            }
          };
        }

        return baseMessage;
      });

      setMessages(formattedHistory);
    } catch (error: any) {
      console.error('發送檔案失敗:', error);
      addSystemMessage(`發送檔案失敗: ${error.message}`);
    }
  };

  const handleFileReceived = async (payload: any) => {
    const { file, sender, receiver, timestamp, id, chatClient } = payload;
    
    try {
      const history = await chatClient.getHistory();
      
      const fileRecord = history.find((msg: any) => 
        msg.id === id && 
        msg.file?.fileUrl && 
        msg.timestamp === timestamp
      );

      if (!fileRecord) {
        throw new Error('找不到對應的檔案記錄');
      }

      const downloadedFile = await new Promise((resolve, reject) => {
        chatClient.downloadFile(
          fileRecord.id,
          fileRecord.file.fileUrl
        ).then((result: any) => {
          if (result instanceof Error) {
            reject(result);
          } else {
            result.onDownloadComplete = (blob: Blob) => {
              resolve(blob);
            };
          }
        }).catch(reject);
      });

      if (!(downloadedFile instanceof Blob)) {
        throw new Error('檔案下載失敗');
      }

      const updatedHistory = await chatClient.getHistory();
      const formattedHistory = updatedHistory.map((msg: any) => {
        const baseMessage = {
          id: `history-${msg.timestamp}-${msg.sender.userId}`,
          senderId: msg.sender.userId,
          senderName: msg.sender.name || '未知用戶',
          message: msg.message || (msg.file ? `已發送檔案: ${msg.file.name}` : ''),
          timestamp: msg.timestamp,
          isPrivate: !!msg.receiver && msg.receiver.userId !== 0,
          receiverId: msg.receiver?.userId === 0 ? undefined : msg.receiver?.userId,
          isSystem: false
        };

        if (msg.file) {
          return {
            ...baseMessage,
            fileInfo: {
              name: msg.file.name,
              size: msg.file.size,
              url: msg.file.fileUrl
            }
          };
        }

        return baseMessage;
      });

      setMessages(formattedHistory);
    } catch (error) {
      console.error('處理接收檔案失敗:', error);
      addSystemMessage('處理接收檔案失敗');
    }
  };

  return {
    messages,
    setMessages,
    translatedMessages,
    setTranslatedMessages,
    addSystemMessage,
    addChatMessage,
    sendFile,
    handleFileReceived
  };
} 