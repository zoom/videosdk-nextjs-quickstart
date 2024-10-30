"use client";

import React, { useState, useRef, useEffect } from 'react';
import { VideoClient, ChatPrivilege } from "@zoom/videosdk";
import ZoomVideo from '@zoom/videosdk';
import { Users, MessageCircle } from "lucide-react";

import { Toast } from '@/components/ui/toast';
import { ToastContainer } from '@/components/ui/toast';

import Chat from '@/components/chat/Chat';
import ParticipantsList from '@/components/participants/ParticipantsList';
import DeviceManager from '@/components/controls/DeviceSettings';
import VideoCallControls from '@/components/controls/ConferenceControls';
import JoinSessionForm from '@/components/JoinSessionForm';

import { useNotifications } from '@/hooks/useNotifications';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useParticipants } from '@/hooks/useParticipants';
import { useEventHandlers } from '@/hooks/useEventHandlers';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useSessionSetup } from '@/hooks/useSessionSetup';

import { renderParticipant } from '@/utils/ParticipantRendering';

interface VideoCallProps {
  slug: string;
  JWT: string;
  role: number;
  password?: string;
} 

const Videocall = (props: VideoCallProps) => {
  const { slug: session, JWT: jwt, role, password } = props;

  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [isVirtualBackgroundEnabled, setIsVirtualBackgroundEnabled] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isParticipantsListVisible, setIsParticipantsListVisible] = useState(false);
  const [isLeavingVoluntarily, setIsLeavingVoluntarily] = useState(false);

  const { notifications, addNotification, removeNotification } = useNotifications();

  const {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    currentAudioInputDevice,
    currentVideoInputDevice,
    currentAudioOutputDevice,
    isAudioMuted,
    isVideoMuted,
    isNoiseSuppressionEnabled,
    setIsAudioMuted,
    setIsVideoMuted,
    setIsNoiseSuppressionEnabled,
    handleSwitchAudioDevice,
    handleSwitchVideoDevice,
    handleSwitchSpeakerDevice,
    handleToggleNoiseSuppression
  } = useDeviceManagement(client, inSession, isMobileBrowser, addNotification);

  const { participants, currentUser, updateParticipantsList } = useParticipants(client, inSession);

  const {
    handleUserAdded,
    handleUserRemoved,
    handleUserUpdated,
    handleDeviceChange,
    handleConnectionChange
  } = useEventHandlers({
    client,
    videoContainerRef,
    updateParticipantsList,
    setIsVideoMuted,
    setIsAudioMuted,
    addNotification,
    setIsLeavingVoluntarily,
    inSession
  });

  const {
    isScreenSharing,
    setIsScreenSharing,
    activeSharer,
    setActiveSharer,
    checkExistingScreenShare,
    handleToggleScreenSharing
  } = useScreenShare({
    client,
    inSession,
    videoContainerRef,
    addNotification
  });

  const { joinSession } = useSessionSetup(client, addNotification);

  // 判斷是否行動裝置
  useEffect(() => {
    const checkMobileBrowser = () => {
      const ua = navigator.userAgent;
      setIsMobileBrowser(/iPhone|iPad|iPod|Android/i.test(ua));
    };
    checkMobileBrowser();
  }, []);

  const handleJoinSession = async (userName: string) => {
    await joinSession(
      session,
      jwt,
      userName,
      password,
      setIsAudioMuted,
      setIsNoiseSuppressionEnabled,
      checkExistingScreenShare,
      setupChatPrivilege,
      setInSession,
      role
    );
  };

  const handleLeaveSession = async () => {
    setIsLeavingVoluntarily(true);
    await client.current.leave();
    window.location.href = "/";
  };

  const handleEndSession = async () => {
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

  return (
    <div className="flex h-full w-full flex-1 flex-col relative">
      <ToastContainer>
        {notifications.map((notification) => (
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
          <JoinSessionForm onJoin={handleJoinSession} />
        </div>
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
            toggleNoiseSuppression={handleToggleNoiseSuppression}
            toggleScreenSharing={handleToggleScreenSharing}
            leaveSession={handleLeaveSession}
            endSession={role === 1 ? handleEndSession : undefined}
            role={role}
            renderVideo={(event: { userId: number }) => renderParticipant(client.current, event.userId, videoContainerRef)}
          />
          <DeviceManager
            audioInputDevices={audioInputDevices}
            videoInputDevices={videoInputDevices}
            audioOutputDevices={audioOutputDevices}
            currentAudioInputDevice={currentAudioInputDevice}
            currentVideoInputDevice={currentVideoInputDevice}
            currentAudioOutputDevice={currentAudioOutputDevice}
            switchAudioDevice={handleSwitchAudioDevice}
            switchVideoDevice={handleSwitchVideoDevice}
            switchSpeakerDevice={handleSwitchSpeakerDevice}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default Videocall;
