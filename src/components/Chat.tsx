import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Settings } from "lucide-react";
import { VideoClient, ChatPrivilege } from "@zoom/videosdk";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FileInfo {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface ChatMessage {
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

interface ChatProps {
  client: React.MutableRefObject<typeof VideoClient>;
  isVisible: boolean;
  onClose: () => void;
}

const privilegeDescriptions: Record<number, string> = {
  // 聊天室權限：https://marketplacefront.zoom.us/sdk/custom/web/enums/ChatPrivilege.html
  1: '允許公開訊息與私訊',
  4: '禁止所有訊息',
  5: '只允許公開訊息'
};

const Chat: React.FC<ChatProps> = ({ client, isVisible, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<'all' | number>('all');
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentPrivilege, setCurrentPrivilege] = useState<ChatPrivilege>(ChatPrivilege.All);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatClient, setChatClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const initializedRef = useRef(false);

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}-${Math.random()}`,
      senderId: 0,
      senderName: '系統訊息',
      message,
      timestamp: Date.now(),
      isPrivate: false,
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };
  
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
        const handlePrivilegeChangeEvent = (payload: any) => {
          const newPrivilege = payload.chatPrivilege;
          setCurrentPrivilege(newPrivilege);
          
          // 只有在權限確實發生變化時才顯示通知
          const description = privilegeDescriptions[newPrivilege] || '未知權限';
          addSystemMessage(`權限更改: ${description}`);
          
          if (newPrivilege === ChatPrivilege.EveryonePublicly && selectedReceiver !== 'all') {
            setSelectedReceiver('all');
          }
          if (newPrivilege === ChatPrivilege.NoOne) {
            setNewMessage('');
          }
        };

        const handleChatMessage = (payload: any) => {
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
          
          setMessages(prev => {
            const isDuplicate = prev.some(msg => msg.id === newChatMessage.id);
            if (isDuplicate) return prev;
            return [...prev, newChatMessage];
          });
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
  }, [isVisible, client]);

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
          addSystemMessage('目前只允許發送公開訊息');
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
    </div>
  );
};

export default Chat;