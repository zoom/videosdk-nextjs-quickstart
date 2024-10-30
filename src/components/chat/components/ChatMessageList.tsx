import React, { useRef } from 'react';

import { ChatMessage } from '@/types/chat';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUser: any;
  participants: any[];
  translatedMessages: Record<string, string>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUser,
  participants,
  translatedMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${
            msg.isSystem ? 'items-center' :
            msg.senderId === currentUser?.userId ? 'items-end' : 'items-start'
          }`}
        >
          {!msg.isSystem && (
            <div className="text-xs text-gray-500 mb-1">
              {msg.senderId === currentUser?.userId ? (
                msg.isPrivate && msg.receiverId ? 
                  `您發送的訊息 (私訊給 ${participants.find(p => p.userId === msg.receiverId)?.displayName || '未知用戶'})` :
                  "您發送的訊息"
              ) : (
                msg.isPrivate ? `${msg.senderName} 私訊給您` : msg.senderName
              )}
            </div>
          )}
          <div
            className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
              msg.isSystem ? 'bg-gray-200 text-gray-600 text-sm' :
              msg.senderId === currentUser?.userId ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            {msg.message}
          </div>
          {!msg.isSystem && translatedMessages[msg.id] && (
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] break-words mt-1 text-sm ${
                msg.senderId === currentUser?.userId ? 'bg-blue-300 text-white' : 'bg-gray-50'
              }`}
            >
              {translatedMessages[msg.id]}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}; 