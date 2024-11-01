import { translationConfig } from '@/config/translation';

export interface FileInfo {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
  receiverId?: number;
  isSystem?: boolean;
  fileInfo?: {
    name: string;
    size: number;
    url: string;
  };
}

export interface FileMessage extends ChatMessage {
  fileInfo?: {
    name: string;
    size: number;
    url: string;
  };
}

export interface TranslationOption {
  value: keyof typeof translationConfig.languages;
  label: string;
}

export type ChatPrivilege = 'all' | 'publicOnly' | 'none';