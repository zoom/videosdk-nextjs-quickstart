import React from 'react';

interface ChatMessageHeaderProps {
  isSender: boolean;
  isPrivate: boolean;
  senderName: string;
  receiverName?: string;
}

export const ChatMessageHeader: React.FC<ChatMessageHeaderProps> = ({
  isSender,
  isPrivate,
  senderName,
  receiverName
}) => {
  return (
    <div className="text-xs text-gray-500 mb-1">
      {isSender ? (
        isPrivate && receiverName ? 
          `您發送的訊息 (私訊給 ${receiverName})` :
          "您發送的訊息"
      ) : (
        isPrivate ? `${senderName} 私訊給您` : senderName
      )}
    </div>
  );
}; 