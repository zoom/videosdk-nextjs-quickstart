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
  file?: FileInfo;
}

export interface TranslationOption {
  value: keyof typeof translationConfig.languages;
  label: string;
} 