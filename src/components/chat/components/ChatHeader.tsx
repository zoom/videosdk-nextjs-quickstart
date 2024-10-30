import React from 'react';
import { ChatPrivilege } from "@zoom/videosdk";
import { Languages, MessageCircle, Settings, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { privilegeDescriptions } from '@/config/chat';

interface ChatHeaderProps {
  onClose: () => void;
  isHost: boolean;
  autoTranslateLanguage: string;
  currentPrivilege: ChatPrivilege;
  onPrivilegeChange: (privilege: ChatPrivilege) => void;
  onTranslateClick: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  isHost,
  autoTranslateLanguage,
  currentPrivilege,
  onPrivilegeChange,
  onTranslateClick
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        <h3 className="font-semibold">聊天室</h3>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTranslateClick}
          className="h-8 w-8"
          title={
            autoTranslateLanguage === 'none' 
              ? "翻譯設定" 
              : `即時翻譯已開啟（${autoTranslateLanguage === 'vi' ? '中→越' : '越→中'}）`
          }
        >
          <Languages className={`h-4 w-4 ${autoTranslateLanguage !== 'none' ? 'text-blue-500' : ''}`} />
        </Button>
        
        {isHost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>聊天室權限設定</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(privilegeDescriptions).map(([privilege, description]) => (
                <DropdownMenuItem
                  key={privilege}
                  onClick={() => onPrivilegeChange(Number(privilege) as ChatPrivilege)}
                >
                  {description as string}
                  {currentPrivilege === Number(privilege) && " ✓"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
