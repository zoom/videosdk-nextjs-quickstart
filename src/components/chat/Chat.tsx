import React, { useState, useEffect, useRef } from 'react';
import { ChatPrivilege, VideoClient } from "@zoom/videosdk";

import { useChats } from '@/hooks/useChats';
import { useTranslation } from '@/hooks/useTranslation';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useChatPrivilege } from '@/hooks/useChatPrivilege';

import { ChatMessage } from '@/types/chat';
import { translationConfig, TranslationLanguage } from '@/config/translation';

import { ChatMessageList } from './components/ChatMessageList';
import { ChatInput } from './components/ChatInput';
import { ReceiverSelect } from './components/ReceiverSelect';
import { ChatHeader } from './components/ChatHeader';
import { TranslationDialog } from './components/TranslationDialog';

interface ChatProps {
  client: React.MutableRefObject<typeof VideoClient>;
  isVisible: boolean;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ client, isVisible, onClose }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<'all' | number>('all');
  const [participants, setParticipants] = useState<any[]>([]);
  const [chatClient, setChatClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const initializedRef = useRef(false);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);

  const {
    messages,
    setMessages,
    addSystemMessage,
    addChatMessage
  } = useChats();

  const {
    isFileTransferEnabled,
    setIsFileTransferEnabled,
    sendFile,
    handleFileReceived,
    downloadFile,
    handleFileUploadEvent,
    initializeFileTransfer
  } = useFileTransfer({
    addSystemMessage,
    setMessages
  });

  const {
    translatedMessages,
    setTranslatedMessages,
    autoTranslateLanguage,
    setAutoTranslateLanguage,
    setTranslation,
    translateChatHistory,
    handleTranslateNewMessage
  } = useTranslation({ 
    addSystemMessage,
    currentUser
  });

  const {
    currentPrivilege,
    setCurrentPrivilege,
    handlePrivilegeChange,
    initializePrivilege,
    handlePrivilegeChangeEvent
  } = useChatPrivilege({ 
    chatClient, 
    addSystemMessage,
    initializedRef
  });

  useEffect(() => {
    if (isVisible && client.current) {
      try {
        const chat = client.current.getChatClient();
        setChatClient(chat);
        setIsConnected(true);
        
        initializeFileTransfer(chat);
        
        const loadChatHistory = async () => {
          try {
            const history = await chat.getHistory();
            const formattedHistory: ChatMessage[] = history.map((msg: any) => ({
              id: msg.id,
              senderId: msg.sender.userId,
              senderName: msg.sender.name || '未知用戶',
              message: msg.message || (msg.file ? `已發送檔案: ${msg.file.name}` : ''),
              timestamp: msg.timestamp,
              isPrivate: !!msg.receiver && msg.receiver.userId !== 0,
              receiverId: msg.receiver?.userId === 0 ? undefined : msg.receiver?.userId,
              isSystem: false,
              ...(msg.file && {
                fileInfo: {
                  name: msg.file.name,
                  size: msg.file.size,
                  url: msg.file.fileUrl
                }
              })
            }));
            setMessages(formattedHistory);
          } catch (error) {
            console.error('獲取聊天記錄失敗:', error);
            addSystemMessage('無法載入歷史訊息');
          }
        };

        loadChatHistory();
        
        const users = client.current.getAllUser();
        setParticipants(users);
        setCurrentUser(client.current.getCurrentUserInfo());

        const handleChatMessage = async (payload: any) => {
          const { message, sender, receiver, timestamp, file } = payload;
          if (file) return;
          if (!sender || !sender.userId) return;
          if (currentPrivilege === ChatPrivilege.NoOne) return;
          if (currentPrivilege === ChatPrivilege.EveryonePublicly && receiver) return;

          const newChatMessage: ChatMessage = {
            id: `${timestamp}-${sender.userId}-${Math.random().toString(36).substr(2, 9)}`,
            senderId: sender.userId,
            senderName: sender.name || '未知用戶',
            message,
            timestamp,
            isPrivate: !!receiver && receiver.userId !== 0,
            receiverId: receiver?.userId === 0 ? undefined : receiver?.userId
          };

          await handleTranslateNewMessage(message, sender.userId, newChatMessage.id);
          
          addChatMessage(newChatMessage);
        };

        const handleUserAdded = () => {
          if (!client.current) return;
          setParticipants(client.current.getAllUser());
        };

        const handleUserRemoved = () => {
          if (!client.current) return;
          setParticipants(client.current.getAllUser());
        };

        client.current.on('chat-privilege-change', handlePrivilegeChangeEvent);
        client.current.on('chat-on-message', handleChatMessage);
        client.current.on('user-added', handleUserAdded);
        client.current.on('user-removed', handleUserRemoved);
        client.current.on('file-received', handleFileReceived);
        
        return () => {
          client.current.off('chat-privilege-change', handlePrivilegeChangeEvent);
          client.current.off('chat-on-message', handleChatMessage);
          client.current.off('user-added', handleUserAdded);
          client.current.off('user-removed', handleUserRemoved);
          client.current.off('file-received', handleFileReceived);
        };
      } catch (error) {
        console.error('初始化聊天室時出錯:', error);
        setIsConnected(false);
      }
    }
  }, [isVisible, client, autoTranslateLanguage]);

  useEffect(() => {
    if (currentPrivilege === ChatPrivilege.EveryonePublicly) {
      setSelectedReceiver('all');
    }
  }, [currentPrivilege]);

  const isMessageAllowed = () => {
    switch (currentPrivilege) {
      case ChatPrivilege.NoOne:
        return false;
      case ChatPrivilege.EveryonePublicly:
        return selectedReceiver === 'all';
      case ChatPrivilege.All:
        return true;
      default:
        return false;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatClient || !isConnected || !isMessageAllowed()) return;

    try {
      if (selectedReceiver === 'all') {
        await chatClient.sendToAll(newMessage);
      } else {
        if (currentPrivilege === ChatPrivilege.EveryonePublicly) {
          addSystemMessage('目前只許發送公開訊息');
          return;
        }
        await chatClient.send(newMessage, selectedReceiver);
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('發送訊息失敗:', error);
      addSystemMessage('發送訊息失敗');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUploadEvent(event, chatClient, selectedReceiver, participants, currentUser);
  };

  if (!isVisible) return null;

  const isHost = currentUser?.isHost || currentUser?.isCoHost;

  if (!isConnected) {
    return (
      <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg w-80 p-4">
        <div className="text-center text-gray-500">
          已離開會議，聊天室已關閉
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg w-80 max-h-[600px] flex flex-col z-50">
      <ChatHeader
        onClose={onClose}
        onOpenTranslateDialog={() => setIsTranslateDialogOpen(true)}
        autoTranslateLanguage={autoTranslateLanguage}
        isHost={isHost}
        currentPrivilege={currentPrivilege}
        onPrivilegeChange={handlePrivilegeChange}
      />

      <ReceiverSelect
        selectedReceiver={selectedReceiver}
        onReceiverChange={setSelectedReceiver}
        currentPrivilege={currentPrivilege}
        participants={participants}
        currentUser={currentUser}
      />

      <ChatMessageList
        messages={messages}
        currentUser={currentUser}
        participants={participants}
        translatedMessages={translatedMessages}
        onFileDownload={(url, fileName, messageId) => downloadFile(chatClient, url, fileName, messageId)}
      />

      <ChatInput 
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        handleFileUpload={handleFileUpload}
        isConnected={isConnected}
        isMessageAllowed={isMessageAllowed()}
        isFileTransferEnabled={isFileTransferEnabled}
        participantsCount={participants.length}
        currentPrivilege={currentPrivilege}
      />

      <TranslationDialog
        isOpen={isTranslateDialogOpen}
        onOpenChange={setIsTranslateDialogOpen}
        autoTranslateLanguage={autoTranslateLanguage}
        onAutoTranslateChange={setAutoTranslateLanguage}
        onTranslateClick={(lang) => translateChatHistory(messages, lang)}
        addSystemMessage={addSystemMessage}
        translationConfig={translationConfig}
      />
    </div>
  );
};

export default Chat;
