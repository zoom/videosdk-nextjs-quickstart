import React from 'react';
import { ChatPrivilege } from "@zoom/videosdk";
import { Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isConnected: boolean;
  isMessageAllowed: boolean;
  isFileTransferEnabled: boolean;
  participantsCount: number;
  currentPrivilege: ChatPrivilege;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  setNewMessage,
  sendMessage,
  handleFileUpload,
  isConnected,
  isMessageAllowed,
  isFileTransferEnabled,
  participantsCount,
  currentPrivilege,
}) => {
  return (
    <div className="p-4 border-t flex gap-2">
      <Input
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
        disabled={!isConnected || !isMessageAllowed || participantsCount <= 1 || !isFileTransferEnabled}
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2 ${
          !isConnected || !isMessageAllowed || participantsCount <= 1 || !isFileTransferEnabled 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
        }`}
        title={!isFileTransferEnabled ? '檔案傳輸功能未啟用' : ''}
      >
        <Paperclip className="h-4 w-4" />
      </label>
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder={
          currentPrivilege === ChatPrivilege.NoOne ? "聊天室已被禁用" :
          currentPrivilege === ChatPrivilege.EveryonePublicly ? "目前只能發送公開訊息" :
          "輸入訊息..."
        }
        className="flex-1"
        disabled={!isConnected || !isMessageAllowed}
      />
      <Button 
        onClick={sendMessage} 
        disabled={!newMessage.trim() || !isConnected || !isMessageAllowed}
      >
        發送
      </Button>
    </div>
  );
};