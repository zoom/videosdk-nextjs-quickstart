import { VideoClient, VideoQuality } from "@zoom/videosdk";

export const renderParticipant = async (client: typeof VideoClient, userId: number, videoContainerRef: React.RefObject<HTMLDivElement>) => {
  if (!client || !videoContainerRef.current) return;

  const mediaStream = client.getMediaStream();
  const user = client.getUser(userId);
  
  if (!user) return;
  
  let videoPlayerContainer = videoContainerRef.current.querySelector('video-player-container');
  if (!videoPlayerContainer) {
    videoPlayerContainer = document.createElement('video-player-container');
    videoPlayerContainer.className = 'video-player-container';
    videoContainerRef.current.appendChild(videoPlayerContainer);
  }

  let videoWrapper = videoPlayerContainer.querySelector(`[data-user-id="${userId}"]`);
  if (!videoWrapper) {
    videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    videoWrapper.setAttribute('data-user-id', userId.toString());
    videoPlayerContainer.appendChild(videoWrapper);
  } else {
    videoWrapper.innerHTML = '';
  }

  const nameOverlay = document.createElement('div');
  nameOverlay.className = 'name-overlay';
  nameOverlay.textContent = user.displayName;
  videoWrapper.appendChild(nameOverlay);

  if (user.bVideoOn) {
    try {
      const videoElement = await mediaStream.attachVideo(userId, VideoQuality.Video_360P);
      if (videoElement instanceof HTMLElement) {
        videoElement.className = 'video-element';
        videoWrapper.appendChild(videoElement);
      } else {
        throw new Error('渲染視訊失敗');
      }
    } catch (error) {
      console.error(`Unable to attach video for user ${userId}:`, error);
      const placeholder = document.createElement('div');
      placeholder.className = 'video-off-placeholder';
      placeholder.textContent = user.displayName;
      videoWrapper.appendChild(placeholder);
    }
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'video-off-placeholder';
    placeholder.textContent = user.displayName;
    videoWrapper.appendChild(placeholder);
  }
};

export const renderAllParticipants = async (client: typeof VideoClient, videoContainerRef: React.RefObject<HTMLDivElement>) => {
  if (!client || !videoContainerRef.current) return;

  const users = client.getAllUser();
  const displayUsers = users.slice(0, 4);

  for (const user of displayUsers) {
    await renderParticipant(client, user.userId, videoContainerRef);
  }
};

export const removeParticipantVideo = (userId: number, videoContainerRef: React.RefObject<HTMLDivElement>) => {
  const videoPlayerContainer = videoContainerRef.current?.querySelector('video-player-container');
  if (videoPlayerContainer) {
    const videoWrapper = videoPlayerContainer.querySelector(`[data-user-id="${userId}"]`);
    if (videoWrapper) {
      videoWrapper.remove();
    }
  }
};