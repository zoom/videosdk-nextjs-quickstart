import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X } from "lucide-react";
import { VideoClient } from "@zoom/videosdk";

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
  receiverId?: number;
}

interface ChatProps {
  client: React.MutableRefObject<typeof VideoClient>;
  isVisible: boolean;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ client, isVisible, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<'all' | number>('all');
  const [participants, setParticipants] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatClient, setChatClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (isVisible && client.current) {
      try {
        const chat = client.current.getChatClient();
        setChatClient(chat);
        setIsConnected(true);

        const users = client.current.getAllUser();
        setParticipants(users);

        const handleChatMessage = (payload: any) => {
          console.log('收到訊息:', payload);
          const { message, sender, receiver, timestamp } = payload;
          
          if (!sender || !sender.userId) return;

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

        const handleConnectionChange = (payload: { state: string }) => {
          if (payload.state === 'Closed') {
            setIsConnected(false);
            setChatClient(null);
            setParticipants([]);
          }
        };

        client.current.on('chat-on-message', handleChatMessage);
        client.current.on('user-added', handleUserAdded);
        client.current.on('user-removed', handleUserRemoved);
        client.current.on('connection-change', handleConnectionChange);

        return () => {
          client.current.off('chat-on-message', handleChatMessage);
          client.current?.off('user-added', handleUserAdded);
          client.current?.off('user-removed', handleUserRemoved);
          client.current?.off('connection-change', handleConnectionChange);
        };
      } catch (error) {
        console.error('初始化聊天室時出錯:', error);
        setIsConnected(false);
      }
    }
    
    return () => {
      setIsConnected(false);
      setChatClient(null);
      setParticipants([]);
    };
  }, [isVisible, client]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatClient || !isConnected) return;

    try {
      if (selectedReceiver === 'all') {
        await chatClient.sendToAll(newMessage);
      } else {
        await chatClient.send(newMessage, selectedReceiver);
      }
      
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  if (!isVisible) return null;

  const currentUser = isConnected && client.current ? client.current.getCurrentUserInfo() : null;

  // 如果已斷開連接，顯示提示訊息
  if (!isConnected) {
    return (
      <div className="fixed right-4 top-24 bg-white rounded-lg shadow-lg w-80 p-4">
        <div className="text-center text-gray-500">
          已離開會議，聊天室已關閉
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg w-80 max-h-[600px] flex flex-col z-10">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">聊天室</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 border-b">
        <select
          value={selectedReceiver === 'all' ? 'all' : selectedReceiver}
          onChange={(e) => setSelectedReceiver(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          <option value="all">發送給所有人</option>
          {participants
            .filter(user => user && user.userId && user.userId !== currentUser?.userId)
            .map(user => (
              <option 
                key={user.userId} 
                value={user.userId}
              >
                私訊給 {user.displayName || user.name || '未知用戶'}
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((msg) => {
          const isFromMe = currentUser?.userId ? msg.senderId === currentUser.userId : false;
          const receiver = msg.isPrivate && msg.receiverId && participants ? 
            participants.find(p => p?.userId === msg.receiverId) : null;
          
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isFromMe ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {isFromMe ? (
                  msg.isPrivate && receiver 
                    ? `您發送的訊息 (私訊給 ${receiver.displayName || receiver.name || '未知用戶'})`
                    : "您發送的訊息"
                ) : (
                  msg.isPrivate 
                    ? `${msg.senderName} 私訊給您`
                    : msg.senderName
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                  isFromMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="輸入訊息..."
          className="flex-1"
          disabled={!isConnected}
        />
        <Button 
          onClick={sendMessage} 
          disabled={!newMessage.trim() || !isConnected}
        >
          發送
        </Button>
      </div>
    </div>
  );
};

export default Chat;