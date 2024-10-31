import React from 'react';
import { ChatPrivilege } from "@zoom/videosdk";

interface ReceiverSelectProps {
  selectedReceiver: 'all' | number;
  onReceiverChange: (value: 'all' | number) => void;
  currentPrivilege: ChatPrivilege;
  participants: any[];
  currentUser: any;
}

export const ReceiverSelect: React.FC<ReceiverSelectProps> = ({
  selectedReceiver,
  onReceiverChange,
  currentPrivilege,
  participants,
  currentUser
}) => {
  const isSelectDisabled = 
    currentPrivilege === ChatPrivilege.NoOne || 
    currentPrivilege === ChatPrivilege.EveryonePublicly;

  return (
    <div className="p-2 border-b">
      <select
        value={selectedReceiver === 'all' ? 'all' : selectedReceiver}
        onChange={(e) => onReceiverChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        className="w-full p-2 border rounded"
        disabled={isSelectDisabled}
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
  );
}; 