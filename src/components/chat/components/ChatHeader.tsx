import React from 'react';
import { MessageCircle, X, Settings } from "lucide-react";
import { ChatPrivilege } from "@zoom/videosdk";
import { TranslationLanguage } from '@/config/translation';

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
import { translationConfig } from '@/config/translation';

interface ChatHeaderProps {
  onClose: () => void;
  onOpenTranslateDialog: () => void;
  autoTranslateLanguage: TranslationLanguage;
  isHost: boolean;
  currentPrivilege: ChatPrivilege;
  onPrivilegeChange: (privilege: ChatPrivilege) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  onOpenTranslateDialog,
  autoTranslateLanguage,
  isHost,
  currentPrivilege,
  onPrivilegeChange
}) => {
  const getTranslationTitle = () => {
    if (autoTranslateLanguage === 'none') return "翻譯設定";
    return `即時翻譯已開啟（${translationConfig.languages[autoTranslateLanguage].displayPair}）`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        <h3 className="font-semibold">聊天室</h3>
      </div>
      <div className="flex items-center gap-2">
        <TranslationButton 
          onClick={onOpenTranslateDialog}
          autoTranslateLanguage={autoTranslateLanguage}
          title={getTranslationTitle()}
        />
        {isHost && (
          <PrivilegeDropdown 
            currentPrivilege={currentPrivilege}
            onPrivilegeChange={onPrivilegeChange}
          />
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

const TranslationButton: React.FC<{
  onClick: () => void;
  autoTranslateLanguage: TranslationLanguage;
  title: string;
}> = ({ onClick, autoTranslateLanguage, title }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="h-8 w-8"
    title={title}
  >
    <TranslationIcon active={autoTranslateLanguage !== 'none' as TranslationLanguage} />
  </Button>
);

const TranslationIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#2563eb" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 8l6 6" />
    <path d="M4 14h7" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const PrivilegeDropdown: React.FC<{
  currentPrivilege: ChatPrivilege;
  onPrivilegeChange: (privilege: ChatPrivilege) => void;
}> = ({ currentPrivilege, onPrivilegeChange }) => (
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
          {description}
          {currentPrivilege === Number(privilege) && " ✓"}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);