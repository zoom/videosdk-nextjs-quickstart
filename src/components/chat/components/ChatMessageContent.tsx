import React from 'react';
import { Paperclip } from "lucide-react";

interface ChatMessageContentProps {
  message: string;
  isSystem: boolean;
  isSender: boolean;
  fileInfo?: {
    name: string;
    size: number;
    url: string;
  };
  onFileDownload?: (url: string, fileName: string, messageId: string) => void;
  messageId: string;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({
  message,
  isSystem,
  isSender,
  fileInfo,
  onFileDownload,
  messageId
}) => {
  return (
    <>
      <div
        className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
          isSystem ? 'bg-gray-200 text-gray-600 text-sm' :
          isSender ? 'bg-blue-500 text-white' : 'bg-gray-100'
        }`}
      >
        {message}
      </div>
      {fileInfo && onFileDownload && (
        <button
          onClick={() => onFileDownload(fileInfo.url, fileInfo.name, messageId)}
          className="text-blue-500 hover:underline cursor-pointer flex items-center gap-2 mt-1"
        >
          <Paperclip className="h-4 w-4" />
          下載檔案: {fileInfo.name} 
          ({Math.round(fileInfo.size / 1024)}KB)
        </button>
      )}
    </>
  );
}; 