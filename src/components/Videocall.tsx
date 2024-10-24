"use client";

import React, { useRef, useState, useEffect } from "react";
import ZoomVideo, {
  VideoClient,
  VideoQuality,
  MediaDevice,
  ChatPrivilege
} from "@zoom/videosdk";

import { CameraButton, MicButton } from "./MuteButtons";
import Chat from './Chat';
import ParticipantsList from './ParticipantsList';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Toast, ToastContainer } from "./ui/toast";
import { Users, AudioWaveform , Monitor, MonitorOff, MessageCircle,  } from "lucide-react";

const Videocall = (props: { slug: string; JWT: string; role: number }) => {
  const { slug: session, JWT: jwt, role } = props;

  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState<string | null>(null);
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState<string | null>(null);
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState<string | null>(null);
  
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userNameError, setUserNameError] = useState("");

  const [notifications, setNotifications] = useState<Array<{ id: number, message: string }>>([]);
  const [isLeavingVoluntarily, setIsLeavingVoluntarily] = useState(false);
    
  const [participants, setParticipants] = useState<any[]>([]);
  const [isParticipantsListVisible, setIsParticipantsListVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isVirtualBackgroundEnabled, setIsVirtualBackgroundEnabled] = useState(false);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [activeSharer, setActiveSharer] = useState<{userId: number; displayName: string} | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const addNotification = (message: string) => {
    const newNotification = { id: Date.now(), message };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 判斷是否行動裝置
  // 參考文件：https://developers.zoom.us/docs/video-sdk/web/video/#mobile-browser-cameras
  useEffect(() => {
    const checkMobileBrowser = () => {
      const ua = navigator.userAgent;
      setIsMobileBrowser(/iPhone|iPad|iPod|Android/i.test(ua));
    };
    checkMobileBrowser();
  }, []);

  // 使用者與設備狀態更新
  useEffect(() => {
    if (inSession) {
      // 以下事件監聽的payload僅回傳userID，無法取得userName
      const handleUserAdded = (payload: any) => {
        console.log(`ID：${payload[0].userId} 加入會話`);
        addNotification(`使用者已加入會話`);
        updateParticipantsList();
        renderAllParticipants();
      };
  
      const handleUserRemoved = (payload: any) => {
        try{
          console.log(`ID：${payload[0].userId} 離開會話`);
          addNotification(`使用者已離開會話`);
          removeParticipantVideo(payload[0].userId);
          updateParticipantsList();
        }
        catch(e){
          console.log("GASDFASDF:", payload);
        }
      };
  
      const handleUserUpdated = (payload: any) => {
        const user = payload[0];
        console.log('User Updated Payload:', payload);
        const currentUser = client.current.getCurrentUserInfo();
        if (currentUser && user.userId === currentUser.userId) {
          if (user.bVideoOn !== undefined) {
            setIsVideoMuted(!user.bVideoOn);
            addNotification(`您已${user.bVideoOn ? '開啟' : '關閉'}鏡頭`);
            renderParticipant(user.userId);
          }
          if (user.muted !== undefined) {
            setIsAudioMuted(user.muted);
            addNotification(`您已${user.muted ? '靜音' : '取消靜音'}`);
          }
        } else {
          // 註：目前測試到開啟鏡頭會被事件"device-change"捕捉到
          if (user.bVideoOn !== undefined) {
            addNotification(`使用者 ID：${user.userId}已${user.bVideoOn ? '開啟' : '關閉'}鏡頭`);
            renderParticipant(user.userId);
          }
          if (user.muted !== undefined) {
            addNotification(`使用者 ID：${user.userId}已${user.muted ? '靜音' : '取消靜音'}`);
          }
        }
        updateParticipantsList(); // 重新渲染參與者清單的設備開關狀態
      };
      
      const handleDeviceChange = () => {
        console.log("檢測到設備變更");
        addNotification("檢測到新的音訊或視訊設備");
        updateDeviceStatus();
      };
  
      const handleConnectionChange = (payload: any) => {
        switch (payload.state) {
          case "Closed":
            if (isLeavingVoluntarily) {
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
      
      const updateParticipantsList = () => {
        try {
          const users = client.current.getAllUser(); // getAllUser：https://marketplacefront.zoom.us/sdk/custom/web/modules/VideoClient.html#getAllUser
          setParticipants(users);
          const current = client.current.getCurrentUserInfo(); // getCurrentUserInfo：https://marketplacefront.zoom.us/sdk/custom/web/modules/VideoClient.html#getCurrentUserInfo
          setCurrentUser(current);
        } catch (error) {
          console.error("更新參與者列表時出錯:", error);
        }
      };

      // on事件文件：https://marketplacefront.zoom.us/sdk/custom/web/modules/VideoClient.html#on
      client.current.on("user-added", handleUserAdded);
      client.current.on("user-removed", handleUserRemoved);
      client.current.on("user-updated", handleUserUpdated);
      client.current.on("device-change", handleDeviceChange);
      client.current.on("connection-change", handleConnectionChange);

      updateParticipantsList();
      updateDeviceStatus();
      renderAllParticipants();
      
      return () => {
        if (client.current) {
          client.current.off("user-added", handleUserAdded);
          client.current.off("user-removed", handleUserRemoved);
          client.current.off("user-updated", handleUserUpdated);
          client.current.off("device-change", handleDeviceChange);
          client.current.off("connection-change", handleConnectionChange);
          if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = '';
          }
        }
      };
    }
  }, [inSession, isLeavingVoluntarily]);

  const joinSession = async () => {
    if (!userName.trim()) {
      setUserNameError("用戶名為必填項");
      return;
    }
    setUserNameError("");

    // 初始化該 Session 的設定和功能選項
    // init：https://marketplacefront.zoom.us/sdk/custom/web/modules/VideoClient.html?_gl=1*1v5tjyb*_gcl_au*NDcxMzc1NjcxLjE3MjgwMzA3NTQ.*_ga*MTMyNDA0ODI0OS4xNzI4MzgyNjA3*_ga_L8TBF28DDX*MTcyOTA0NzA3NS4xOS4xLjE3MjkwNDcwNzcuMC4wLjA.#init
    // 功能選項：https://marketplacefront.zoom.us/sdk/custom/web/interfaces/InitOptions.html#webEndpoint
    await client.current.init("en-US", "Global", { patchJsMedia: true });

    // 用指定的 userName(在該會議中會以此為顯示名稱)(密碼為可選)，加入指定的 Session Name，只要Session Name或密碼不同，就不會進到同個Session
    // join：https://marketplacefront.zoom.us/sdk/custom/web/modules/VideoClient.html?_gl=1*17lv3c0*_gcl_au*NDcxMzc1NjcxLjE3MjgwMzA3NTQ.*_ga*MTMyNDA0ODI0OS4xNzI4MzgyNjA3*_ga_L8TBF28DDX*MTcyOTIyNzE0My4yNy4xLjE3MjkyMzA4MjMuMC4wLjA.#join
    await client.current.join(session, jwt, userName).catch((e) => {
      console.log(e);
    });
    console.log("成功加入會議");

    setInSession(true);

    // Midea stream：https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#stopPreviewVirtualBackground
    const mediaStream = client.current.getMediaStream();
    
    // 加入音訊
    // startAudio：https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#startAudio
    try {
      // 啟動音訊時直接開啟噪音抑制
      await mediaStream.startAudio({ backgroundNoiseSuppression: true }); // startAudio功能選項：https://marketplacefront.zoom.us/sdk/custom/web/interfaces/AudioOption.html
      setIsAudioMuted(false);
      setIsNoiseSuppressionEnabled(true);
    } catch (error) {
      console.error("啟動音訊失敗:", error);
      setIsAudioMuted(true);
      setIsNoiseSuppressionEnabled(false);
      addNotification("無法啟動麥克風，請檢查權限設置");
    }
    // 進入時直接加入視訊
    // try {
    //   await mediaStream.startVideo();
    //   setIsVideoMuted(false);
    // } catch (error) {
    //   console.error("啟動視訊失敗:", error);
    //   setIsVideoMuted(true);
    //   addNotification("無法啟動鏡頭，請檢查權限設置");
    // }
    
    // 不馬上加入視訊
    setIsVideoMuted(true); // 設置初始狀態為視訊關閉
    
    // 檢查現有的螢幕分享
    try {
      console.log("正在檢查現有的螢幕分享...");
      const activeShareUserId = await mediaStream.getActiveShareUserId();
      console.log("取得的 activeShareUserId:", activeShareUserId);

      if (activeShareUserId && activeShareUserId !== 0) {
        console.log("檢測到現有的螢幕分享，分享者ID:", activeShareUserId);
        const sharingUser = client.current.getUser(activeShareUserId);
        console.log("分享者資訊:", sharingUser);

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
          videoContainerRef.current.innerHTML = '';
          const wrapper = document.createElement('div');
          wrapper.className = 'screen-share-wrapper';
          wrapper.appendChild(shareViewCanvas);
          wrapper.appendChild(sharerInfo);
          videoContainerRef.current.appendChild(wrapper);
          
          try {
            await mediaStream.startShareView(shareViewCanvas, activeShareUserId);
            console.log("成功開始觀看分享畫面");
            await renderAllParticipants();
            setActiveSharer({
              userId: activeShareUserId,
              displayName: sharingUser?.displayName || '未知用戶'
            });
            addNotification(`${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`);
          } catch (startShareError) {
            console.error("開始觀看分享畫面失敗:", startShareError);
            videoContainerRef.current.innerHTML = '';
            await renderAllParticipants();
            addNotification("連接到分享畫面失敗，請稍後重試");
          }
        }
      } else {
        console.log("目前沒有進行中的螢幕分享");
        await renderAllParticipants();
      }
    } catch (shareCheckError) {
      console.error("檢查螢幕分享狀態時出錯:", shareCheckError);
      addNotification("檢查螢幕分享狀態失敗");
      await renderAllParticipants();
    }
    
    // 啟用聊天室權限
    const chatClient = client.current.getChatClient();
    try {
      // 使用 ChatPrivilege.All 來啟用所有聊天功能
      await chatClient.setPrivilege(ChatPrivilege.All);
      console.log("聊天室權限設定成功");
    } catch (error) {
      console.error("設定聊天室權限失敗:", error);
      addNotification("無法啟用聊天功能");
    }

    await updateDeviceStatus();
  };
  
  const leaveSession = async () => {
    setIsLeavingVoluntarily(true);
    await client.current.leave();
    window.location.href = "/";
  };

  const endSession = async () => {
    try {
      await client.current.leave(true);
      addNotification("會話已被主持人結束");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("結束會話時失敗:", error);
      addNotification("結束會話時失敗，請重試");
    }
  };
  
  const renderParticipant = async (userId: number) => {
    if (!client.current || !videoContainerRef.current) return;
  
    const mediaStream = client.current.getMediaStream();
    const user = client.current.getUser(userId);
    
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
        const videoElement = await mediaStream.attachVideo(userId, VideoQuality.Video_360P);// 更高畫質：https://developers.zoom.us/docs/video-sdk/web/video/#hd-video
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

  const renderAllParticipants = async () => {
    if (!client.current || !videoContainerRef.current) return;
  
    const users = client.current.getAllUser();
    const displayUsers = users.slice(0, 4);
  
    for (const user of displayUsers) {
      await renderParticipant(user.userId);
    }
  };

  const removeParticipantVideo = (userId: number) => {
    const videoPlayerContainer = videoContainerRef.current?.querySelector('video-player-container');
    if (videoPlayerContainer) {
      const videoWrapper = videoPlayerContainer.querySelector(`[data-user-id="${userId}"]`);
      if (videoWrapper) {
        videoWrapper.remove();
      }
    }
  };
  
  // 設備相關文件：https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#getSpeakerList
  const updateDeviceStatus = async () => {
    const mediaStream = client.current.getMediaStream();
    
    // 獲取音訊輸入設備列表
    const mics = await mediaStream.getMicList();
    setAudioInputDevices(mics);
    
    // 獲取視訊輸入設備列表
    let cameras;
    if (isMobileBrowser) {
      // 針對行動瀏覽器的相機處理
      const mobileCameras = [
        { deviceId: 'user', label: '前置鏡頭' },
        { deviceId: 'environment', label: '後置鏡頭' }
      ];
      cameras = mobileCameras;
    } else {
      cameras = await mediaStream.getCameraList();
    }
    setVideoInputDevices(cameras);
    
    // 獲取喇叭輸出裝置列表
    const speakers = await mediaStream.getSpeakerList();
    setAudioOutputDevices(speakers);
    
    // 獲取當前使用的音訊輸入設備
    const currentMic = await mediaStream.getActiveMicrophone();
    setCurrentAudioInputDevice(currentMic);
    
    // 獲取當前使用的視訊輸入設備
    const currentCamera = await mediaStream.getActiveCamera();
    setCurrentVideoInputDevice(currentCamera);
    
    // 獲取目前使用的喇叭輸出裝置
    const currentSpeaker = await mediaStream.getActiveSpeaker();
    setCurrentAudioOutputDevice(currentSpeaker);

    // 檢查音訊狀態
    const audioState = await mediaStream.isAudioMuted();
    setIsAudioMuted(audioState);
    
    // 檢查視訊狀態
    const videoState = await mediaStream.isCapturingVideo();
    setIsVideoMuted(!videoState);
  };

  const switchAudioDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.switchMicrophone(deviceId);
      setCurrentAudioInputDevice(deviceId);
      addNotification("已切換音訊輸入設備");
    } catch (error) {
      console.error("切換音訊設備失敗:", error);
      addNotification("切換音訊設備失敗，請重試");
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      if (isMobileBrowser) {
        // 針對行動瀏覽器的相機切換
        await mediaStream.switchCamera(deviceId);
      } else {
        await mediaStream.switchCamera(deviceId);
      }
      setCurrentVideoInputDevice(deviceId);
      addNotification("已切換視訊輸入設備");
    } catch (error) {
      console.error("切換視訊設備失敗:", error);
      addNotification("切換視訊設備失敗，請重試");
    }
  };

  const switchSpeakerDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.switchSpeaker(deviceId);
      setCurrentAudioOutputDevice(deviceId);
      addNotification("已切換喇叭輸出裝置");
    } catch (error) {
      console.error("切換喇叭設備失敗:", error);
      addNotification("切換喇叭設備失敗，請重試");
    }
  };

  const toggleNoiseSuppression = async () => {
    const mediaStream = client.current.getMediaStream();
    try {
      const newState = !isNoiseSuppressionEnabled;
      await mediaStream.enableBackgroundNoiseSuppression(newState);
      setIsNoiseSuppressionEnabled(newState);
      addNotification(`已${newState ? '開啟' : '關閉'}背景噪音抑制`);
    } catch (error) {
      console.error("切換背景噪音抑制失敗:", error);
      addNotification("切換背景噪音抑制失敗，請重試");
    }
  };

  const toggleScreenSharing = async () => {
    const mediaStream = client.current.getMediaStream();
    const currentUser = client.current.getCurrentUserInfo();
  
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
        await renderAllParticipants();
      } else {
        await mediaStream.stopShareScreen();
        setIsScreenSharing(false);
        setActiveSharer(null);
        addNotification("已停止螢幕分享");
        
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
        }
        await renderAllParticipants();
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
    await renderAllParticipants();
  }
  };

  useEffect(() => {
    if (inSession) {
      const handleActiveShareChange = async (payload: {
        state: string;
        activeUserId: number;
      }) => {
        const mediaStream = client.current.getMediaStream();
        const currentUser = client.current.getCurrentUserInfo();
        const sharingUser = client.current.getUser(payload.activeUserId);
        
        try {
          if (payload.state === 'Active') {
            setActiveSharer({
              userId: payload.activeUserId,
              displayName: sharingUser?.displayName || '未知用戶'
            });
            
            if (payload.activeUserId !== currentUser.userId) {
              const shareViewCanvas = document.createElement('canvas') as HTMLCanvasElement;
              shareViewCanvas.style.width = '100%';
              shareViewCanvas.style.height = '100%';
              shareViewCanvas.className = 'screen-share-view';
              shareViewCanvas.width = 1920;
              shareViewCanvas.height = 1080;
              
              const sharerInfo = document.createElement('div');
              sharerInfo.className = 'sharer-info';
              sharerInfo.textContent = `${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`;
              
              if (videoContainerRef.current) {
                videoContainerRef.current.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = 'screen-share-wrapper';
                wrapper.appendChild(shareViewCanvas);
                wrapper.appendChild(sharerInfo);
                videoContainerRef.current.appendChild(wrapper);
              }
              
              await mediaStream.startShareView(shareViewCanvas, payload.activeUserId);
              addNotification(`${sharingUser?.displayName || '未知用戶'} 開始了螢幕分享`);
            }
          } else if (payload.state === 'Inactive') {
            setActiveSharer(null);
            await mediaStream.stopShareView();
            
            if (payload.activeUserId === currentUser.userId) {
              addNotification("您已停止螢幕分享");
            } else {
              addNotification(`${sharingUser?.displayName || '未知用戶'} 的螢幕分享已結束`);
            }
            
            if (videoContainerRef.current) {
              videoContainerRef.current.innerHTML = '';
            }
            await renderAllParticipants();
          }
        } catch (error) {
          console.error("螢幕分享處理錯誤:", error);
          if (error instanceof Error) {
            addNotification("螢幕分享錯誤：" + error.message);
          } else {
            addNotification("螢幕分享處理失敗");
          }
          
          setActiveSharer(null);
          if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = '';
          }
          await renderAllParticipants();
        }
      };

      client.current.on("active-share-change", handleActiveShareChange);

      return () => {
        client.current.off("active-share-change", handleActiveShareChange);
      };
    }
  }, [inSession]);

  return (
    <div className="flex h-full w-full flex-1 flex-col relative">
      <ToastContainer>
        {notifications.map(notification => (
          <Toast 
            key={notification.id} 
            message={notification.message} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </ToastContainer>

        <h1 className="text-center text-3xl font-bold mb-4 mt-0">
          會話: {session}
        </h1>

        <div className="flex-1 flex justify-center items-center">
          <div 
            className="video-container w-full max-w-4xl aspect-video"
            ref={videoContainerRef}
          >
          </div>
        </div>
        
        <div className="flex h-full w-full flex-1 flex-col">
        {inSession && (
          <>
          <Chat 
            client={client}
            isVisible={isChatVisible}
            onClose={() => setIsChatVisible(false)}
          />

          <ParticipantsList 
            participants={participants} 
            currentUser={currentUser}
            isVisible={isParticipantsListVisible}
            onClose={() => setIsParticipantsListVisible(false)}
          />

          <div className="fixed bottom-4 left-4 flex gap-4">
            <button 
              onClick={() => setIsParticipantsListVisible(!isParticipantsListVisible)}
              className="fixed bottom-24 left-4 bg-blue-500 text-white p-2 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors z-50"
            > 

              <Users size={24} />
              <span className="ml-2">{participants.length}</span>
            </button>
            <button
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="bg-blue-500 text-white p-2 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <MessageCircle size={24} />
            </button>
          </div>
          </>
        )}
        
        {!inSession ? (
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
            
            <Input
              type="password"
              placeholder="請輸入密碼（可選）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            
            <Button 
              className="flex flex-1" 
              onClick={joinSession} 
              title="join session"
              disabled={!userName.trim()}
            >
              加入會話
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center">
            <div className="mt-4 flex w-full max-w-2xl justify-around rounded-md bg-white p-4">
              <MicButton
                isAudioMuted={isAudioMuted}
                client={client}
                setIsAudioMuted={setIsAudioMuted}
              />
              <Button 
                onClick={toggleNoiseSuppression}
                variant={isNoiseSuppressionEnabled ? "default" : "outline"}
                className="flex items-center space-x-2"
                title={isNoiseSuppressionEnabled ? "關閉麥克風噪音抑制" : "開啟麥克風噪音抑制"}
              >
              {isNoiseSuppressionEnabled ? (
                <>
                  <AudioWaveform className="h-4 w-4 text-green-500" />
                  <span>噪音抑制已開啟</span>
                </>
              ) : (
                <>
                  <AudioWaveform className="h-4 w-4 text-gray-400" />
                  <span>噪音抑制已關閉</span>
                </>
              )}
              </Button>
              <CameraButton
                client={client}
                isVideoMuted={isVideoMuted}
                setIsVideoMuted={setIsVideoMuted}
                isVirtualBackgroundEnabled={isVirtualBackgroundEnabled}
                setIsVirtualBackgroundEnabled={setIsVirtualBackgroundEnabled}
                renderVideo={(event) => renderParticipant(event.userId)}
              />
              <Button 
                onClick={toggleScreenSharing}
                variant={isScreenSharing ? "default" : "outline"}
                className="flex items-center space-x-2"
                title={isScreenSharing ? "停止螢幕分享" : "開始螢幕分享"}
              >
                {isScreenSharing ? (
                  <>
                    <MonitorOff className="h-4 w-4" />
                    <span>停止分享</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4" />
                    <span>分享螢幕</span>
                  </>
                )}
              </Button>
              <Button onClick={leaveSession} title="leave session">
                離開會話
              </Button>
              {role === 1 && (
                <Button onClick={endSession} title="end session">
                  結束會話
                </Button>
              )}
            </div>
            <div className="mt-4 flex w-full max-w-2xl justify-center space-x-4">
              <div>
                <select
                  value={currentAudioInputDevice || ''}
                  onChange={(e) => switchAudioDevice(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="">選擇音訊設備</option>
                  {audioInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `音訊設備 ${device.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={currentVideoInputDevice || ''}
                  onChange={(e) => switchVideoDevice(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="">選擇視訊設備</option>
                  {videoInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `視訊設備 ${device.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={currentAudioOutputDevice || ''}
                  onChange={(e) => switchSpeakerDevice(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="">選擇喇叭設備</option>
                  {audioOutputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `喇叭設備 ${device.deviceId}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videocall;