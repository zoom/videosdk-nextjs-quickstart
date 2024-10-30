import { useState, useEffect } from 'react';
import { VideoClient } from "@zoom/videosdk";

export const useParticipants = (
  client: React.MutableRefObject<typeof VideoClient>, 
  inSession: boolean
) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const updateParticipantsList = () => {
    try {
      const users = client.current.getAllUser();
      setParticipants(users);
      const current = client.current.getCurrentUserInfo();
      setCurrentUser(current);
    } catch (error) {
      console.error("更新參與者列表時出錯:", error);
    }
  };

  useEffect(() => {
    if (inSession) {
      updateParticipantsList();
    }
  }, [inSession]);

  return { participants, currentUser, updateParticipantsList };
}; 