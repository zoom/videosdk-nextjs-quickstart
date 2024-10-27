import { VideoClient } from "@zoom/videosdk";

export const toggleScreenSharing = async (
  client: typeof VideoClient,
  isScreenSharing: boolean,
  setIsScreenSharing: (value: boolean) => void,
  setActiveSharer: (value: { userId: number; displayName: string } | null) => void,
  addNotification: (message: string) => void,
  videoContainerRef: React.RefObject<HTMLDivElement>,
  renderAllParticipants: (client: typeof VideoClient, videoContainerRef: React.RefObject<HTMLDivElement>) => Promise<void>
) => {
  const mediaStream = client.getMediaStream();
  const currentUser = client.getCurrentUserInfo();

  try {
    if (!isScreenSharing) {
      const shareVideo = document.createElement('video') as HTMLVideoElement;
      shareVideo.style.width = '100%';
      shareVideo.style.height = '100%';
      
      const sharerInfo = document.createElement('div');
      sharerInfo.className = 'sharer-info';
      sharerInfo.textContent = `${currentUser.displayName} (您) 正在分享螢幕`;
      
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'screen-share-wrapper';
        wrapper.appendChild(shareVideo);
        wrapper.appendChild(sharerInfo);
        videoContainerRef.current.appendChild(wrapper);
      }

      await mediaStream.startShareScreen(shareVideo);
      setIsScreenSharing(true);
      setActiveSharer({
        userId: currentUser.userId,
        displayName: currentUser.displayName
      });
      addNotification("已開始螢幕分享");
      await renderAllParticipants(client, videoContainerRef);
    } else {
      await mediaStream.stopShareScreen();
      setIsScreenSharing(false);
      setActiveSharer(null);
      addNotification("已停止螢幕分享");
      
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
      await renderAllParticipants(client, videoContainerRef);
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
    await renderAllParticipants(client, videoContainerRef);
  }
};

