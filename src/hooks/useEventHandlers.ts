import { useEffect } from 'react';
import { VideoClient } from '@zoom/videosdk';

import { renderParticipant, renderAllParticipants, removeParticipantVideo } from '@/utils/ParticipantRendering';

interface UseEventHandlersProps {
  client: React.MutableRefObject<typeof VideoClient>;
  videoContainerRef: React.RefObject<HTMLDivElement>;
  updateParticipantsList: () => void;
  setIsVideoMuted: (value: boolean) => void;
  setIsAudioMuted: (value: boolean) => void;
  addNotification: (message: string) => void;
  setIsLeavingVoluntarily: (value: boolean) => void;
  inSession: boolean;
} 

export const useEventHandlers = ({
  client,
  videoContainerRef,
  updateParticipantsList,
  setIsVideoMuted,
  setIsAudioMuted,
  addNotification,
  setIsLeavingVoluntarily,
  inSession
}: UseEventHandlersProps) => {
  const handleUserAdded = (payload: any) => {
    if (payload.length == 0) return;
    console.log(`ID：${payload[0].userId} 加入會話`);
    addNotification(`使用者已加入會話`);
    updateParticipantsList();
    renderAllParticipants(client.current, videoContainerRef);
  };

  const handleUserRemoved = (payload: any) => {
    if (payload.length == 0) return;
    console.log(`ID：${payload[0].userId} 離開會話`);
    addNotification(`使用者已離開會話`);
    removeParticipantVideo(payload[0].userId, videoContainerRef);
    updateParticipantsList();
  };

  const handleUserUpdated = (payload: any) => {
    const user = payload[0];
    console.log('User Updated Payload:', payload);
    const currentUser = client.current.getCurrentUserInfo();
    if (currentUser && user.userId === currentUser.userId) {
      if (user.bVideoOn !== undefined) {
        setIsVideoMuted(!user.bVideoOn);
        addNotification(`您已${user.bVideoOn ? '開啟' : '關閉'}鏡頭`);
        renderParticipant(client.current, user.userId, videoContainerRef);
      }
      if (user.muted !== undefined) {
        setIsAudioMuted(user.muted);
        addNotification(`您已${user.muted ? '靜音' : '取消靜音'}`);
      }
    } else {
      if (user.bVideoOn !== undefined) {
        addNotification(`使用者 ID：${user.userId}已${user.bVideoOn ? '開啟' : '關閉'}鏡頭`);
        renderParticipant(client.current, user.userId, videoContainerRef);
      }
      if (user.muted !== undefined) {
        addNotification(`使用者 ID：${user.userId}已${user.muted ? '靜音' : '取消靜音'}`);
      }
    }
    updateParticipantsList();
  };

  const handleDeviceChange = () => {
    console.log("檢測到設備變更");
    addNotification("檢測到新的音訊或視訊設備");
  };

  const handleConnectionChange = (payload: any) => {
    switch (payload.state) {
      case "Closed":
        if (setIsLeavingVoluntarily) {
          addNotification("您已離開會話");
          setIsLeavingVoluntarily(false);
        } else {
          addNotification("會話已被主持人結束或您被踢出會話");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
        break;
      case "Reconnecting":
        addNotification("正在嘗試重新連接...");
        break;
      case "Connected":
        addNotification("已重新連接到會話");
        break;
      case "Fail":
        addNotification("無法重新連接到會話，請重新加入");
        break;
    }
  };

  useEffect(() => {
    if (inSession) {
      client.current.on("user-added", handleUserAdded);
      client.current.on("user-removed", handleUserRemoved);
      client.current.on("user-updated", handleUserUpdated);
      client.current.on("device-change", handleDeviceChange);
      client.current.on("connection-change", handleConnectionChange);
      
      updateParticipantsList();
      renderAllParticipants(client.current, videoContainerRef);
      
      return () => {
        client.current.off("user-added", handleUserAdded);
        client.current.off("user-removed", handleUserRemoved);
        client.current.off("user-updated", handleUserUpdated);
        client.current.off("device-change", handleDeviceChange);
        client.current.off("connection-change", handleConnectionChange);
      };
    }
  }, [inSession]);

  return {
    handleUserAdded,
    handleUserRemoved,
    handleUserUpdated,
    handleDeviceChange,
    handleConnectionChange
  };
};