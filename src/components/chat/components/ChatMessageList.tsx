import React, { useEffect, useRef } from 'react';

import { ChatMessageHeader } from '@/components/chat/components/ChatMessageHeader';
import { ChatMessageContent } from '@/components/chat/components/ChatMessageContent';

import { ChatMessage } from '@/types/chat';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUser: any;
  participants: any[];
  translatedMessages: Record<string, string>;
  onFileDownload: (url: string, fileName: string, messageId: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUser,
  participants,
  translatedMessages,
  onFileDownload
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getReceiverName = (receiverId?: number) => {
    if (!receiverId) return undefined;
    return participants.find(p => p.userId === receiverId)?.displayName || '未知用戶';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
      {messages.map((message) => {
        const isSender = message.senderId === currentUser?.userId;
        
        return (
          <div
            key={`${message.id}-${message.timestamp}`}
            className={`flex flex-col ${
              message.isSystem ? 'items-center' :
              isSender ? 'items-end' : 'items-start'
            }`}
          >
            {!message.isSystem && (
              <ChatMessageHeader
                isSender={isSender}
                isPrivate={message.isPrivate}
                senderName={message.senderName}
                receiverName={getReceiverName(message.receiverId)}
              />
            )}
            
            <ChatMessageContent
              message={message.message}
              isSystem={message.isSystem || false}
              isSender={isSender}
              fileInfo={message.fileInfo}
              onFileDownload={onFileDownload}
              messageId={message.id}
            />

            {!message.isSystem && translatedMessages[message.id] && (
              <div
                key={`translated-${message.id}`}
                className={`rounded-lg px-4 py-2 max-w-[80%] break-words mt-1 text-sm ${
                  isSender ? 'bg-blue-300 text-white' : 'bg-gray-50'
                }`}
              >
                {translatedMessages[message.id]}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};