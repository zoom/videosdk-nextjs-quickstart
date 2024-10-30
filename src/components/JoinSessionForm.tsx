import React, { useState } from 'react';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface JoinSessionFormProps {
  onJoin: (userName: string) => void;
}

const JoinSessionForm: React.FC<JoinSessionFormProps> = ({ onJoin }) => {
  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");

  const handleJoin = () => {
    if (!userName.trim()) {
      setUserNameError("用戶名為必填項");
      return;
    }
    setUserNameError("");
    onJoin(userName);
  };

  return (
    <div className="mx-auto flex w-64 flex-col self-center">
      <Input
        type="text"
        placeholder="請輸入用戶名"
        value={userName}
        onChange={(e) => {
          setUserName(e.target.value);
          if (e.target.value.trim()) setUserNameError("");
        }}
        className={`mb-2 ${userNameError ? 'border-red-500' : ''}`}
      />
      {userNameError && <p className="text-red-500 text-sm mb-2">{userNameError}</p>}
      
      <Button 
        className="flex flex-1" 
        onClick={handleJoin} 
        title="join session"
        disabled={!userName.trim()}
      >
        加入會話
      </Button>
    </div>
  );
};

export default JoinSessionForm;
