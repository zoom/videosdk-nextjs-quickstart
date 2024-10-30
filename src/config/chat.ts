import { ChatPrivilege } from "@zoom/videosdk";

export const privilegeDescriptions: Record<ChatPrivilege, string> = {
  [ChatPrivilege.All]: '允許公開訊息與私訊',
  [ChatPrivilege.NoOne]: '禁止所有訊息',
  [ChatPrivilege.EveryonePublicly]: '只允許公開訊息'
} as const; 