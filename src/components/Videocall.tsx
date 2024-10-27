"use client";

import React, { useRef, useState, useEffect } from "react";
import ZoomVideo, {
  VideoClient,
  ChatPrivilege
} from "@zoom/videosdk";

import Chat from './Chat';
import ParticipantsList from './ParticipantsList';
import VideoCallControls from './ConferenceControls';
import JoinSessionForm from './JoinSessionForm';

import { Toast, ToastContainer } from "./ui/toast";
import { Users, MessageCircle } from "lucide-react";
import DeviceManager from './DeviceSelector';

import {
  setupEventListeners,
  cleanupEventListeners,
  initializeSession,
  joinZoomSession,
  setupAudioAndVideo,
} from '../utils/ConferenceUtils';

import { useDevices, useParticipants } from '../hooks/userVideocall';
import { renderParticipant, renderAllParticipants, removeParticipantVideo } from '../utils/ParticipantRendering';

const Videocall = (props: { slug: string; JWT: string; role: number }) => {
  const { slug: session, JWT: jwt, role } = props;

  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  const {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    currentAudioInputDevice,
    currentVideoInputDevice,
    currentAudioOutputDevice,
    isAudioMuted,
    isVideoMuted,
    setIsAudioMuted,
    setIsVideoMuted,
    setCurrentAudioInputDevice,
    setCurrentVideoInputDevice,
    setCurrentAudioOutputDevice
  } = useDevices(client, inSession, isMobileBrowser);

  const { participants, currentUser, updateParticipantsList } = useParticipants(client, inSession);

  const [notifications, setNotifications] = useState<Array<{ id: number, message: string }>>([]);
  const [isLeavingVoluntarily, setIsLeavingVoluntarily] = useState(false);
    
  const [isParticipantsListVisible, setIsParticipantsListVisible] = useState(false);

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
      setupEventListeners(client.current, {
        handleUserAdded,
        handleUserRemoved,
        handleUserUpdated,
        handleDeviceChange,
        handleConnectionChange
      });
      updateParticipantsList();
      renderAllParticipants(client.current, videoContainerRef);
      
      return () => cleanupEventListeners(client.current, {
        handleUserAdded,
        handleUserRemoved,
        handleUserUpdated,
        handleDeviceChange,
        handleConnectionChange
      });
    }
  }, [inSession, isLeavingVoluntarily]);

  // 處理用戶加入事件
  const handleUserAdded = (payload: any) => {
    if (payload.length == 0) return;
    console.log(`ID：${payload[0].userId} 加入會話`);
    addNotification(`使用者已加入會話`);
    updateParticipantsList();
    renderAllParticipants(client.current, videoContainerRef);
  };

  // 處理用戶離開事件
  const handleUserRemoved = (payload: any) => {
    if (payload.length == 0) return;
    console.log(`ID：${payload[0].userId} 離開會話`);
    addNotification(`使用者已離開會話`);
    removeParticipantVideo(payload[0].userId, videoContainerRef);
    updateParticipantsList();
  };

  // 處理用戶更新事件
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

  // 處理設備變更事件
  const handleDeviceChange = () => {
    console.log("檢測到設備變更");
    addNotification("檢測到新的音訊或視訊設備");
  };

  // 處理連接狀態變更事件
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

  const joinSession = async (userName: string, password: string) => {
    await initializeSession(client.current);
    await joinZoomSession(client.current, session, jwt, userName);
    await setupAudioAndVideo(client.current, setIsAudioMuted, setIsNoiseSuppressionEnabled, addNotification);
    await checkExistingScreenShare();
    await setupChatPrivilege();
    setInSession(true);
  };

  // 檢查現有的螢幕分享
  const checkExistingScreenShare = async () => {
    const mediaStream = client.current.getMediaStream();
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
            await renderAllParticipants(client.current, videoContainerRef);
            setActiveSharer({
              userId: activeShareUserId,
              displayName: sharingUser?.displayName || '未知用戶'
            });
            addNotification(`${sharingUser?.displayName || '未知用戶'} 正在分享螢幕`);
          } catch (startShareError) {
            console.error("開始觀看分享畫面失敗:", startShareError);
            videoContainerRef.current.innerHTML = '';
            await renderAllParticipants(client.current, videoContainerRef);
            addNotification("連接到分享畫面失敗，請稍後重試");
          }
        }
      } else {
        console.log("目前沒有進行中的螢幕分享");
        await renderAllParticipants(client.current, videoContainerRef);
      }
    } catch (shareCheckError) {
      console.error("檢查螢幕分享狀態時出錯:", shareCheckError);
      addNotification("檢查螢幕分享狀態失敗");
      await renderAllParticipants(client.current, videoContainerRef);
    }
  };

  // 設置聊天權限
  const setupChatPrivilege = async () => {
    const chatClient = client.current.getChatClient();
    try {
      await chatClient.setPrivilege(ChatPrivilege.All);
      console.log("聊天室權限設定成功");
    } catch (error) {
      console.error("設定聊天室權限失敗:", error);
      addNotification("無法啟用聊天功能");
    }
  };

  // 離開會話
  const leaveSession = async () => {
    setIsLeavingVoluntarily(true);
    await client.current.leave();
    window.location.href = "/";
  };

  // 結束會話 (主持人功能)
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

  // 切換音訊設備
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

  // 切換視訊設備
  const switchVideoDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      if (isMobileBrowser) {
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

  // 切換喇叭設備
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

  // 切換噪音抑制
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

  // 切換螢幕分享
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
        await renderAllParticipants(client.current, videoContainerRef);
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

  // 處理螢幕分享變更
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
            await renderAllParticipants(client.current, videoContainerRef);
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
          await renderAllParticipants(client.current, videoContainerRef);
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
        <JoinSessionForm onJoin={joinSession} />
      ) : (
        <div className="flex w-full flex-col items-center">
          <VideoCallControls
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            isNoiseSuppressionEnabled={isNoiseSuppressionEnabled}
            isScreenSharing={isScreenSharing}
            isVirtualBackgroundEnabled={isVirtualBackgroundEnabled}
            client={client}
            setIsAudioMuted={setIsAudioMuted}
            setIsVideoMuted={setIsVideoMuted}
            setIsVirtualBackgroundEnabled={setIsVirtualBackgroundEnabled}
            toggleNoiseSuppression={toggleNoiseSuppression}
            toggleScreenSharing={toggleScreenSharing}
            leaveSession={leaveSession}
            endSession={role === 1 ? endSession : undefined}
            role={role}
            renderVideo={(event) => renderParticipant(client.current, event.userId, videoContainerRef)}
          />
          <DeviceManager
            audioInputDevices={audioInputDevices}
            videoInputDevices={videoInputDevices}
            audioOutputDevices={audioOutputDevices}
            currentAudioInputDevice={currentAudioInputDevice}
            currentVideoInputDevice={currentVideoInputDevice}
            currentAudioOutputDevice={currentAudioOutputDevice}
            switchAudioDevice={switchAudioDevice}
            switchVideoDevice={switchVideoDevice}
            switchSpeakerDevice={switchSpeakerDevice}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default Videocall;