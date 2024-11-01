import { useState, useEffect } from 'react';
import { ChatPrivilege } from "@zoom/videosdk";
import { privilegeDescriptions } from '@/config/chat';

interface UseChatPrivilegeProps {
  chatClient: any;
  addSystemMessage: (message: string) => void;
  initializedRef: React.MutableRefObject<boolean>;
}

export const useChatPrivilege = ({ 
  chatClient, 
  addSystemMessage,
  initializedRef
}: UseChatPrivilegeProps) => {
  const [currentPrivilege, setCurrentPrivilege] = useState<ChatPrivilege>(ChatPrivilege.All);

  const handlePrivilegeChange = async (privilege: ChatPrivilege) => {
    if (!chatClient) return;
    try {
      await chatClient.setPrivilege(privilege);
      setCurrentPrivilege(privilege);
    } catch (error) {
      console.error('設定聊天權限失敗:', error);
      addSystemMessage('設定聊天權限失敗');
    }
  };

  const initializePrivilege = async () => {
    if (!chatClient) {
      console.error('聊天客戶端尚未初始化');
      return;
    }

    try {
      const privilege = await chatClient.getPrivilege();
      setCurrentPrivilege(privilege);
      if (!initializedRef.current) {
        addSystemMessage(`權限: ${privilegeDescriptions[privilege as ChatPrivilege]}`);
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('獲取初始聊天權限失敗:', error);
    }
  };

  const handlePrivilegeChangeEvent = (payload: { chatPrivilege: ChatPrivilege }) => {
    const newPrivilege = payload.chatPrivilege;
    setCurrentPrivilege(newPrivilege);
    addSystemMessage(`權限更改: ${privilegeDescriptions[newPrivilege]}`);
  };

  useEffect(() => {
    if (chatClient) {
      initializePrivilege();
    }
  }, [chatClient]);

  return {
    currentPrivilege,
    setCurrentPrivilege,
    handlePrivilegeChange,
    initializePrivilege,
    handlePrivilegeChangeEvent
  };
}; 