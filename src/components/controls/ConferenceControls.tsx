import React from 'react';
import { AudioWaveform, Monitor, MonitorOff, } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MicButton, CameraButton } from "@/components/controls/MuteButtons";

interface VideoCallControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isNoiseSuppressionEnabled: boolean;
  isScreenSharing: boolean;
  isVirtualBackgroundEnabled: boolean;
  client: React.MutableRefObject<any>;
  setIsAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVirtualBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleNoiseSuppression: () => void;
  toggleScreenSharing: () => void;
  leaveSession: () => void;
  endSession?: () => void;
  role: number;
  renderVideo: (event: { action: "Start" | "Stop"; userId: number; }) => Promise<void>;
}

const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isAudioMuted,
  isVideoMuted,
  isNoiseSuppressionEnabled,
  isScreenSharing,
  isVirtualBackgroundEnabled,
  client,
  setIsAudioMuted,
  setIsVideoMuted,
  setIsVirtualBackgroundEnabled,
  toggleNoiseSuppression,
  toggleScreenSharing,
  leaveSession,
  endSession,
  role,
  renderVideo
}) => {
  return (
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
        renderVideo={renderVideo}
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
      {role === 1 && endSession && (
        <Button onClick={endSession} title="end session">
          結束會話
        </Button>
      )}
    </div>
  );
};

export default VideoCallControls;
