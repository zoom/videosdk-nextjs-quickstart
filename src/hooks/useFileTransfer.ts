import { useState } from 'react';
import { FileMessage } from '@/types/chat';

interface UseFileTransferProps {
  addSystemMessage: (message: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<FileMessage[]>>;
}

export const useFileTransfer = ({ addSystemMessage, setMessages }: UseFileTransferProps) => {
  const [isFileTransferEnabled, setIsFileTransferEnabled] = useState(false);

  const formatHistoryWithFile = (history: any[]) => {
    return history.map((msg: any) => {
      const baseMessage = {
        id: msg.id,
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
          const cancelUpload = await chatClient.sendFile(file, user.userId);
          
          if (cancelUpload instanceof Error) {
            throw cancelUpload;
          }
        }
      } else {
        const cancelUpload = await chatClient.sendFile(file, receiver);
        
        if (cancelUpload instanceof Error) {
          throw cancelUpload;
        }
      }

      const newFileMessage: FileMessage = {
        id: `file-${Date.now()}-${Math.random()}`,
        senderId: currentUser.userId,
        senderName: currentUser.name || '未知用戶',
        message: `已發送檔案: ${file.name}`,
        timestamp: Date.now(),
        isPrivate: receiver !== 'all',
        receiverId: receiver === 'all' ? undefined : receiver,
        isSystem: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          url: ''
        }
      };

      setMessages(prev => [...prev, newFileMessage]);
    } catch (error: any) {
      console.error('發送檔案失敗:', error);
      addSystemMessage(`發送檔案失敗: ${error.message}`);
    }
  };

  const handleFileReceived = async (payload: any) => {
    const { file, sender, receiver, timestamp, id, chatClient } = payload;
    
    try {
      const newFileMessage: FileMessage = {
        id,
        senderId: sender.userId,
        senderName: sender.name || '未知用戶',
        message: `已發送檔案: ${file.name}`,
        timestamp,
        isPrivate: !!receiver && receiver.userId !== 0,
        receiverId: receiver?.userId === 0 ? undefined : receiver?.userId,
        isSystem: false,
        fileInfo: {
          name: file.name,
          size: file.size,
          url: file.fileUrl
        }
      };

      setMessages(prev => [...prev, newFileMessage]);
    } catch (error) {
      console.error('處理接收檔案失敗:', error);
      addSystemMessage('處理接收檔案失敗');
    }
  };

  const downloadFile = async (
    chatClient: any,
    fileUrl: string,
    fileName: string,
    messageId: string
  ) => {
    try {
      const downloadedFile = await chatClient.downloadFile(messageId, fileUrl);
      if (downloadedFile instanceof Error) {
        throw downloadedFile;
      }

      const blob = await new Promise((resolve, reject) => {
        downloadedFile.onDownloadComplete = (blob: Blob) => {
          resolve(blob);
        };
        downloadedFile.onDownloadError = (error: Error) => {
          reject(error);
        };
      });

      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下載檔案失敗:', error);
      addSystemMessage('下載檔案失敗');
    }
  };

  const handleFileUploadEvent = async (
    event: React.ChangeEvent<HTMLInputElement>,
    chatClient: any,
    selectedReceiver: 'all' | number,
    participants: any[],
    currentUser: any
  ) => {
    const file = event.target.files?.[0];
    if (!file || !chatClient) return;
    
    if (!isFileTransferEnabled) {
      addSystemMessage('檔案傳輸功能未啟用');
      event.target.value = '';
      return;
    }
    
    await sendFile(chatClient, file, selectedReceiver, participants, currentUser);
    event.target.value = '';
  };

  const initializeFileTransfer = (chatClient: any) => {
    const fileTransferEnabled = chatClient.isFileTransferEnabled();
    setIsFileTransferEnabled(fileTransferEnabled);
    
    if (!fileTransferEnabled) {
      addSystemMessage('檔案傳輸功能未啟用');
    }

    return fileTransferEnabled;
  };

  return {
    isFileTransferEnabled,
    setIsFileTransferEnabled,
    sendFile,
    handleFileReceived,
    downloadFile,
    handleFileUploadEvent,
    initializeFileTransfer,
  };
}; 