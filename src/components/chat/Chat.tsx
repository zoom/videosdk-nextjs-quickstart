import React, { useState, useEffect, useRef } from 'react';
import { VideoClient, ChatPrivilege } from "@zoom/videosdk";
import { MessageCircle, X, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

import { useChats } from '@/hooks/useChats';
import { useTranslation } from '@/hooks/useTranslation';

import { ChatMessage } from '@/types/chat';
import { privilegeDescriptions } from '@/config/chat';
import { translationConfig, TranslationLanguage, AllLanguages, LanguageConfig } from '@/config/translation';

interface ChatProps {
  client: React.MutableRefObject<typeof VideoClient>;
  isVisible: boolean;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ client, isVisible, onClose }) => {
  const {
    messages,
    setMessages,
    addSystemMessage,
    addChatMessage,
  } = useChats();

  const {
    translatedMessages,
    setTranslatedMessages,
    autoTranslateLanguage,
    setAutoTranslateLanguage,
    translateMessages,
    handleTranslate,
    setTranslation
  } = useTranslation({ addSystemMessage });

  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<'all' | number>('all');
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentPrivilege, setCurrentPrivilege] = useState<ChatPrivilege>(ChatPrivilege.All);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatClient, setChatClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const initializedRef = useRef(false);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);

  const handlePrivilegeChange = async (privilege: ChatPrivilege) => {
    if (!chatClient) return;
    try {
      await chatClient.setPrivilege(privilege);
    } catch (error) {
      console.error('設定聊天權限失敗:', error);
      addSystemMessage('設定聊天權限失敗');
    }
  };

  useEffect(() => {
    if (isVisible && client.current) {
      try {
        const chat = client.current.getChatClient();
        setChatClient(chat);
        setIsConnected(true);

        // 獲取歷史訊息
        const loadChatHistory = async () => {
          try {
            const history = await chat.getHistory();
            const formattedHistory: ChatMessage[] = history.map((msg: any) => ({
              id: `history-${msg.timestamp}-${msg.sender.userId}`,
              senderId: msg.sender.userId,
              senderName: msg.sender.name || '未知用戶',
              message: msg.message,
              timestamp: msg.timestamp,
              isPrivate: !!msg.receiver && msg.receiver.userId !== 0,
              receiverId: msg.receiver?.userId === 0 ? undefined : msg.receiver?.userId,
              isSystem: false
            }));
            setMessages(formattedHistory);
          } catch (error) {
            console.error('獲取聊天記錄失敗:', error);
            addSystemMessage('無法載入歷史訊息');
          }
        };

        loadChatHistory();

        const users = client.current.getAllUser();
        setParticipants(users);
        setCurrentUser(client.current.getCurrentUserInfo());

        // 只在第一次初始化時獲取並顯示權限
        const initializePrivilege = async () => {
          try {
            const privilege = await chat.getPrivilege();
            setCurrentPrivilege(privilege);
            // 只在組件首次掛載時顯示初始權限訊息
            if (!initializedRef.current) {
              addSystemMessage(`權限: ${privilegeDescriptions[privilege]}`);
              initializedRef.current = true;
            }
          } catch (error) {
            console.error('獲取初始聊天權限失敗:', error);
          }
        };
        
        initializePrivilege();

        // 權限變更時的處理程序
        const handlePrivilegeChangeEvent = (payload: { chatPrivilege: ChatPrivilege }) => {
          const newPrivilege = payload.chatPrivilege;
          setCurrentPrivilege(newPrivilege);
          
          const description = privilegeDescriptions[newPrivilege] || '未知權限';
          addSystemMessage(`權限更改: ${description}`);
          
          if (newPrivilege === ChatPrivilege.EveryonePublicly && selectedReceiver !== 'all') {
            setSelectedReceiver('all');
          }
          if (newPrivilege === ChatPrivilege.NoOne) {
            setNewMessage('');
          }
        };

        const handleChatMessage = async (payload: any) => {
          const { message, sender, receiver, timestamp } = payload;
          
          if (!sender || !sender.userId) return;

          if (currentPrivilege === ChatPrivilege.NoOne) return;
          if (currentPrivilege === ChatPrivilege.EveryonePublicly && receiver) return;

          const newChatMessage: ChatMessage = {
            id: `${timestamp}-${sender.userId}-${Math.random().toString(36).substr(2, 9)}`,
            senderId: sender.userId,
            senderName: sender.name || '未知用戶',
            message,
            timestamp,
            isPrivate: !!receiver && receiver.userId !== 0,
            receiverId: receiver?.userId === 0 ? undefined : receiver?.userId
          };
          if (sender.userId !== currentUser?.userId && autoTranslateLanguage !== 'none') {
            try {
              const translations = await translateMessages([message], autoTranslateLanguage);
              if (translations && Array.isArray(translations) && translations[0]) {
                setTranslation(newChatMessage.id, translations[0]);
              }
            } catch (error) {
              console.error('自動翻譯失敗:', error);
            }
          }
          
          addChatMessage(newChatMessage);
        };

        const handleUserAdded = () => {
          if (!client.current) return;
          const updatedUsers = client.current.getAllUser();
          setParticipants(updatedUsers);
        };

        const handleUserRemoved = () => {
          if (!client.current) return;
          const updatedUsers = client.current.getAllUser();
          setParticipants(updatedUsers);
        };

        client.current.on('chat-privilege-change', handlePrivilegeChangeEvent);
        client.current.on('chat-on-message', handleChatMessage);
        client.current.on('user-added', handleUserAdded);
        client.current.on('user-removed', handleUserRemoved);

        return () => {
          client.current.off('chat-privilege-change', handlePrivilegeChangeEvent);
          client.current.off('chat-on-message', handleChatMessage);
          client.current.off('user-added', handleUserAdded);
          client.current.off('user-removed', handleUserRemoved);
        };
      } catch (error) {
        console.error('初始化聊天室時出錯:', error);
        setIsConnected(false);
      }
    }
  }, [isVisible, client, autoTranslateLanguage]);

  useEffect(() => {
    if (currentPrivilege === ChatPrivilege.EveryonePublicly) {
      setSelectedReceiver('all');
    }
  }, [currentPrivilege]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isMessageAllowed = () => {
    switch (currentPrivilege) {
      case ChatPrivilege.NoOne:
        return false;
      case ChatPrivilege.EveryonePublicly:
        return selectedReceiver === 'all';
      case ChatPrivilege.All:
        return true;
      default:
        return false;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatClient || !isConnected || !isMessageAllowed()) return;

    try {
      if (selectedReceiver === 'all') {
        await chatClient.sendToAll(newMessage);
      } else {
        if (currentPrivilege === ChatPrivilege.EveryonePublicly) {
          addSystemMessage('目前只許發送公開訊息');
          return;
        }
        await chatClient.send(newMessage, selectedReceiver);
      }
      
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('發送訊息失敗:', error);
      addSystemMessage('發送訊息失敗');
    }
  };

  const handleTranslateClick = (targetLang: 'vi' | 'zh') => {
    handleTranslate(messages, targetLang);
    setIsTranslateDialogOpen(false);
  };

  if (!isVisible) return null;

  const isHost = currentUser?.isHost || currentUser?.isCoHost;

  if (!isConnected) {
    return (
      <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg w-80 p-4">
        <div className="text-center text-gray-500">
          已離開會議，聊天室已關閉
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg w-80 max-h-[600px] flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">聊天室</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsTranslateDialogOpen(true)}
            className="h-8 w-8"
            title={
              autoTranslateLanguage === 'none' 
                ? "翻譯設定" 
                : `即時翻譯已開啟（${autoTranslateLanguage === 'vi' ? '中→越' : '越→中'}）`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={autoTranslateLanguage === 'none' ? "currentColor" : "#2563eb"}
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
                    onClick={() => handlePrivilegeChange(Number(privilege) as ChatPrivilege)}
                  >
                    {description}
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

      <div className="p-2 border-b">
        <select
          value={selectedReceiver === 'all' ? 'all' : selectedReceiver}
          onChange={(e) => setSelectedReceiver(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full p-2 border rounded"
          disabled={currentPrivilege === ChatPrivilege.NoOne || currentPrivilege === ChatPrivilege.EveryonePublicly}
        >
          <option value="all">發送給所有人</option>
          {participants
            .filter(user => user && user.userId && user.userId !== currentUser?.userId)
            .map(user => (
              <option 
                key={user.userId} 
                value={user.userId}
                disabled={currentPrivilege === ChatPrivilege.EveryonePublicly}
              >
                私訊給 {user.displayName || user.name || '未知用戶'}
              </option>
            ))}
        </select>
      </div>

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

      <div className="p-4 border-t flex gap-2">
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
          disabled={!isConnected || !isMessageAllowed()}
        />
        <Button 
          onClick={sendMessage} 
          disabled={!newMessage.trim() || !isConnected || !isMessageAllowed()}
        >
          發送
        </Button>
      </div>

      <Dialog open={isTranslateDialogOpen} onOpenChange={setIsTranslateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>翻譯設定</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">即時翻譯</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant={autoTranslateLanguage === 'none' ? "default" : "outline"}
                  onClick={() => {
                    setAutoTranslateLanguage('none');
                    addSystemMessage('已關閉即時翻譯');
                  }}
                >
                  關閉翻譯
                  {autoTranslateLanguage === 'none' && " ✓"}
                </Button>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.entries(translationConfig.languages) as [AllLanguages, LanguageConfig][])
                    .filter(([code]) => code !== 'none')
                    .map(([code, lang]) => (
                      <Button 
                        key={code}
                        variant={autoTranslateLanguage === code ? "default" : "outline"}
                        onClick={() => {
                          setAutoTranslateLanguage(
                            autoTranslateLanguage === code ? 'none' : code as TranslationLanguage
                          );
                          addSystemMessage(
                            autoTranslateLanguage === code
                              ? '已關閉即時翻譯'
                              : `已開啟即時翻譯（${lang.displayName}）`
                          );
                        }}
                      >
                        {lang.displayName}
                        {autoTranslateLanguage === code && " ✓"}
                      </Button>
                    ))}
                </div>
              </div>

              <Separator className="my-4" />
              
              <h4 className="font-medium">聊天記錄翻譯</h4>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(translationConfig.languages) as [AllLanguages, LanguageConfig][])
                  .filter(([code]) => code !== 'none')
                  .map(([code, lang]) => (
                    <Button 
                      key={code}
                      variant="outline"
                      onClick={() => handleTranslateClick(code as TranslationLanguage)}
                    >
                      {lang.displayName}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
