import { useState, useEffect } from 'react';
import { VideoClient } from '@zoom/videosdk';

import { renderAllParticipants } from '@/utils/ParticipantRendering';

import { ActiveSharer } from '@/types/screenShare';

interface UseScreenShareProps {
  client: React.MutableRefObject<typeof VideoClient>;
  inSession: boolean;
  videoContainerRef: React.RefObject<HTMLDivElement>;
  addNotification: (message: string) => void;
}
// 創建一個輔助函數來包裝 HTMLDivElement
const createRefFromElement = (element: HTMLDivElement): React.RefObject<HTMLDivElement> => ({
  current: element
});

export const useScreenShare = ({
  client,
  inSession,
  videoContainerRef,
  addNotification
}: UseScreenShareProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSharer, setActiveSharer] = useState<ActiveSharer | null>(null);

  const handleToggleScreenSharing = async () => {
    const mediaStream = client.current.getMediaStream();
    const currentUser = client.current.getCurrentUserInfo();

    try {
      if (!isScreenSharing) {
        const shareVideo = document.createElement('video');
        shareVideo.style.width = '100%';
        shareVideo.style.height = '100%';
        
        const sharerInfo = document.createElement('div');
        sharerInfo.className = 'sharer-info';
        sharerInfo.textContent = `${currentUser.displayName} (您) 正在分享螢幕`;
        
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
          
          const leftSection = document.createElement('div');
          leftSection.className = 'left-section';
          leftSection.style.width = '100%';
          leftSection.style.float = 'left';
          
          const wrapper = document.createElement('div');
          wrapper.className = 'screen-share-wrapper';
          wrapper.appendChild(shareVideo);
          wrapper.appendChild(sharerInfo);
          
          leftSection.appendChild(wrapper);
          videoContainerRef.current.appendChild(leftSection);
          
          const rightSection = document.createElement('div');
          rightSection.className = 'right-section';
          rightSection.style.width = '100%';
          rightSection.style.float = 'right';
          rightSection.id = 'participants-container';
          videoContainerRef.current.appendChild(rightSection);
          
          await new Promise(resolve => setTimeout(resolve, 0));
          await mediaStream.startShareScreen(shareVideo);
          setIsScreenSharing(true);
          setActiveSharer({
            userId: currentUser.userId,
            displayName: currentUser.displayName
          });
          addNotification("已開始螢幕分享");
          await renderAllParticipants(client.current, createRefFromElement(rightSection));
        }
      } else {
        await mediaStream.stopShareScreen();
        setIsScreenSharing(false);
        setActiveSharer(null);
        addNotification("已停止螢幕分享");
        
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
        }
        await renderAllParticipants(client.current, videoContainerRef);
      }
    } catch (error) {
      console.error("螢幕分享錯誤:", error);
      
      if (error instanceof Error) {
        switch(error.message) {
          case 'Permission denied':
            addNotification("使用者拒絕了螢幕分享權限");
            break;
          case 'NOT_SUPPORTED':
            addNotification("您的瀏覽器不支援螢幕分享功能");
            break;
          case 'INVALID_PARAMETERS':
            addNotification("螢幕分享失敗：無效的參數");
            break;
          default:
            addNotification("螢幕分享失敗：" + error.message);
        }
      } else {
        addNotification("螢幕分享失敗，請重試");
      }
      
      setIsScreenSharing(false);
      
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
      await renderAllParticipants(client.current, videoContainerRef);
    }
  };

  const checkExistingScreenShare = async () => {
    const mediaStream = client.current.getMediaStream();
    try {
      const activeShareUserId = await mediaStream.getActiveShareUserId();
      if (activeShareUserId && activeShareUserId !== 0) {
        const sharingUser = client.current.getUser(activeShareUserId);
        const shareViewCanvas = document.createElement('canvas');
        shareViewCanvas.style.width = '100%';
        shareViewCanvas.style.height = '100%';
        shareViewCanvas.className = 'screen-share-view';
        shareViewCanvas.width = 1920;
        shareViewCanvas.height = 1080;

        const sharerInfo = document.createElement('div');
        sharerInfo.className = 'sharer-info';
        sharerInfo.textContent = `${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`;

        if (videoContainerRef.current) {
          const leftSection = document.createElement('div');
          leftSection.className = 'left-section';
          leftSection.style.width = '100%';
          leftSection.style.float = 'left';
          
          const wrapper = document.createElement('div');
          wrapper.className = 'screen-share-wrapper';
          wrapper.appendChild(shareViewCanvas);
          wrapper.appendChild(sharerInfo);
          
          leftSection.appendChild(wrapper);
          videoContainerRef.current.innerHTML = '';
          videoContainerRef.current.appendChild(leftSection);
          
          const rightSection = document.createElement('div');
          rightSection.className = 'right-section';
          rightSection.style.width = '100%';
          rightSection.style.float = 'right';
          videoContainerRef.current.appendChild(rightSection);
          
          try {
            await new Promise(resolve => setTimeout(resolve, 0));
            await mediaStream.startShareView(shareViewCanvas, activeShareUserId);
            setActiveSharer({
              userId: activeShareUserId,
              displayName: sharingUser?.displayName || '未知用戶'
            });
            addNotification(`${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`);
            await renderAllParticipants(client.current, createRefFromElement(rightSection));
          } catch (e) {
            console.error("開始分享畫面失敗:", e);
            addNotification("連接到分享畫面失敗，請稍後重試");
            videoContainerRef.current.innerHTML = '';
            await renderAllParticipants(client.current, videoContainerRef);
          }
        }
      } else {
        await renderAllParticipants(client.current, videoContainerRef);
      }
    } catch (error) {
      console.error("檢查螢幕分享狀態時出錯:", error);
      addNotification("檢查螢幕分享狀態失敗");
      await renderAllParticipants(client.current, videoContainerRef);
    }
  };

  useEffect(() => {
    if (inSession) {
      const handleActiveShareChange = async (payload: {
        state: string;
        userId: number;
      }) => {
        const mediaStream = client.current.getMediaStream();
        const currentUser = client.current.getCurrentUserInfo();
        const sharingUser = client.current.getUser(payload.userId);
        
        try {
          if (payload.state === 'Active' && payload.userId !== currentUser.userId) {
            setActiveSharer({
              userId: payload.userId,
              displayName: sharingUser?.displayName || '未知用戶'
            });
            
            const shareViewCanvas = document.createElement('canvas');
            shareViewCanvas.style.width = '100%';
            shareViewCanvas.style.height = '100%';
            shareViewCanvas.className = 'screen-share-view';
            shareViewCanvas.width = 1280;
            shareViewCanvas.height = 720;
            
            const sharerInfo = document.createElement('div');
            sharerInfo.className = 'sharer-info';
            sharerInfo.textContent = `${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`;
            
            if (videoContainerRef.current) {
              videoContainerRef.current.innerHTML = '';
              
              const leftSection = document.createElement('div');
              leftSection.className = 'left-section';
              leftSection.style.width = '100%';
              leftSection.style.float = 'left';
              
              const wrapper = document.createElement('div');
              wrapper.className = 'screen-share-wrapper';
              wrapper.appendChild(shareViewCanvas);
              wrapper.appendChild(sharerInfo);
              
              leftSection.appendChild(wrapper);
              videoContainerRef.current.appendChild(leftSection);
              
              const rightSection = document.createElement('div');
              rightSection.className = 'right-section';
              rightSection.style.width = '100%';
              rightSection.style.float = 'right';
              videoContainerRef.current.appendChild(rightSection);
              
              await mediaStream.startShareView(shareViewCanvas, payload.userId);
              await renderAllParticipants(client.current, createRefFromElement(rightSection));
            }
          } else if (payload.state === 'Inactive') {
            setActiveSharer(null);
            await mediaStream.stopShareView();
            
            if (videoContainerRef.current) {
              videoContainerRef.current.innerHTML = '';
            }
            await renderAllParticipants(client.current, videoContainerRef);
            
            if (payload.userId === currentUser.userId) {
              addNotification("您已停止螢幕分享");
            } else {
              addNotification(`${sharingUser?.displayName || '未知用戶'} 的螢幕分享已結束`);
            }
          }
        } catch (error) {
          console.error("螢幕分享處理錯誤:", error);
          setActiveSharer(null);
          if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = '';
          }
          await renderAllParticipants(client.current, videoContainerRef);
          
          if (error instanceof Error) {
            addNotification("螢幕分享錯誤：" + error.message);
          } else {
            addNotification("螢幕分享處理失敗");
          }
        }
      };

      client.current.on("active-share-change", handleActiveShareChange);

      return () => {
        client.current.off("active-share-change", handleActiveShareChange);
      };
    }
  }, [inSession]);

  return {
    isScreenSharing,
    setIsScreenSharing,
    activeSharer,
    setActiveSharer,
    checkExistingScreenShare,
    handleToggleScreenSharing
  };
}; 