import { type Dispatch, type SetStateAction } from "react";
import type { VideoClient } from "@zoom/videosdk";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const MicButton = (props: {
  client: typeof VideoClient;
  isAudioMuted: boolean;
  setIsAudioMuted: Dispatch<SetStateAction<boolean>>;
}) => {
  const { client, isAudioMuted, setIsAudioMuted } = props;
  const onMicrophoneClick = async () => {
    const mediaStream = client.getMediaStream();
    if (isAudioMuted) { await mediaStream?.unmuteAudio() } else { await mediaStream?.muteAudio() }
    setIsAudioMuted(client.getCurrentUserInfo().muted ?? true);
  };
  return (
    <button onClick={onMicrophoneClick} title="microphone">
      {isAudioMuted ? <MicOff /> : <Mic />}
    </button>
  );
};

const CameraButton = (props: {
  client: typeof VideoClient;
  isVideoMuted: boolean;
  setIsVideoMuted: Dispatch<SetStateAction<boolean>>;
  renderVideo: (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => Promise<void>;
}) => {
  const { client, isVideoMuted, setIsVideoMuted, renderVideo } = props;

  const onCameraClick = async () => {
    const mediaStream = client.getMediaStream();
    try {
      if (isVideoMuted) {
        await mediaStream.startVideo();
        setIsVideoMuted(false);
        await renderVideo({
          action: "Start",
          userId: client.getCurrentUserInfo().userId,
        });
      } else {
        await mediaStream.stopVideo();
        setIsVideoMuted(true);
        await renderVideo({
          action: "Stop",
          userId: client.getCurrentUserInfo().userId,
        });
      }
    } catch (e) {
      console.warn("error in mute/unmute video", e)
    }
  };

  return (
    <button onClick={onCameraClick} title="camera">
      {isVideoMuted ? <VideoOff /> : <Video />}
    </button>
  );
};

export { MicButton, CameraButton };
