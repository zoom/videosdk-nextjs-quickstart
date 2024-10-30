import React, { useState, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { type VideoClient } from "@zoom/videosdk";
import { Mic, MicOff, Video, VideoOff, ChevronDown, ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface MicButtonProps {
  client: MutableRefObject<typeof VideoClient>;
  isAudioMuted: boolean;
  setIsAudioMuted: Dispatch<SetStateAction<boolean>>;
}

interface CameraButtonProps {
  client: MutableRefObject<typeof VideoClient>;
  isVideoMuted: boolean;
  setIsVideoMuted: Dispatch<SetStateAction<boolean>>;
  isVirtualBackgroundEnabled: boolean;
  setIsVirtualBackgroundEnabled: Dispatch<SetStateAction<boolean>>;
  renderVideo: (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => Promise<void>;
}

const MicButton: React.FC<MicButtonProps> = ({ client, isAudioMuted, setIsAudioMuted }) => {
  const onMicrophoneClick = async () => {
    const mediaStream = client.current.getMediaStream();
    isAudioMuted ? await mediaStream?.unmuteAudio() : await mediaStream?.muteAudio();
    setIsAudioMuted(client.current.getCurrentUserInfo().muted ?? true);
  };
  
  return (
    <button onClick={onMicrophoneClick} title="microphone">
      {isAudioMuted ? <MicOff /> : <Mic />}
    </button>
  );
};

const CameraButton: React.FC<CameraButtonProps> = ({
  client,
  isVideoMuted,
  setIsVideoMuted,
  isVirtualBackgroundEnabled,
  setIsVirtualBackgroundEnabled,
  renderVideo,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopVideo = async () => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.stopVideo();
      setIsVideoMuted(true);
      setIsVirtualBackgroundEnabled(false);
      await renderVideo({ 
        action: "Stop", 
        userId: client.current.getCurrentUserInfo().userId 
      });
    } catch (error) {
      console.error('停止視訊失敗:', error);
    }
  };

  const startVideoWithVirtualBackground = async () => {
    const mediaStream = client.current.getMediaStream();
    const canvas = canvasRef.current;
    
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    try {
      // 如果視訊已開啟，先停止視訊
      if (!isVideoMuted) {
        await stopVideo();
      }

      // isSupportVirtualBackground：https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#isSupportVirtualBackground
      const isSupported = await mediaStream.isSupportVirtualBackground();
      if (!isSupported) {
        console.error('此設備不支援虛擬背景功能');
        return;
      }

      await mediaStream.startVideo();
      // previewVirtualBackground：https://marketplacefront.zoom.us/sdk/custom/web/modules/Stream.html#previewVirtualBackground
      await mediaStream.previewVirtualBackground(
        canvas,
        '/backgrounds/bg1.jpg',
        true
      );
      setIsVideoMuted(false);
      setIsVirtualBackgroundEnabled(true);
      await renderVideo({ 
        action: "Start", 
        userId: client.current.getCurrentUserInfo().userId 
      });
    } catch (error) {
      console.error('啟動虛擬背景失敗:', error);
    }
  };

  const startNormalVideo = async () => {
    const mediaStream = client.current.getMediaStream();
    try {
      // 如果視訊已開啟，先停止視訊
      if (!isVideoMuted) {
        await stopVideo();
      }

      await mediaStream.startVideo();
      setIsVideoMuted(false);
      setIsVirtualBackgroundEnabled(false);
      await renderVideo({ 
        action: "Start", 
        userId: client.current.getCurrentUserInfo().userId 
      });
    } catch (error) {
      console.error('啟動視訊失敗:', error);
    }
  };

  const handleMainButtonClick = async () => {
    if (!isVideoMuted) {
      await stopVideo();
    } else {
      await startNormalVideo();
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex">
            <Button 
              variant="outline" 
              className="rounded-r-none px-3"
              onClick={handleMainButtonClick}
            >
              {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
            <Button variant="outline" className="rounded-l-none border-l-0 px-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={startNormalVideo}
            disabled={!isVideoMuted && !isVirtualBackgroundEnabled}
          >
            <Video className="mr-2 h-4 w-4" />
            <span>一般視訊</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={startVideoWithVirtualBackground}
            disabled={!isVideoMuted && isVirtualBackgroundEnabled}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>使用虛擬背景</span>
          </DropdownMenuItem>
          <Separator />
          <DropdownMenuItem 
            onClick={stopVideo}
            disabled={isVideoMuted}
          >
            <VideoOff className="mr-2 h-4 w-4" />
            <span>關閉視訊</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export { MicButton, CameraButton };