"use client";

import { CSSProperties, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { WorkAroundForSafari } from "@/lib/utils";
import { PhoneOff } from "lucide-react";
import { Button } from "./ui/button";

const Videocall = (props: { slug: string; JWT: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const [inCall, setInCall] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(
    !client.current.getCurrentUserInfo()?.bVideoOn
  );
  const [isAudioMuted, setIsAudioMuted] = useState(
    client.current.getCurrentUserInfo()?.muted ?? true
  );
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const init = async () => {
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      (payload) => void renderVideo(payload)
    );
    await client.current.join(session, jwt, userName).catch((e) => {
      console.log(e);
    });
  };

  const startCall = async () => {
    await init();
    setInCall(true);
    const mediaStream = client.current.getMediaStream();
    // @ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
    window.safari
      ? await WorkAroundForSafari(client.current)
      : await mediaStream.startAudio();
    setIsAudioMuted(client.current.getCurrentUserInfo().muted ?? true);
    await mediaStream.startVideo();
    setIsVideoMuted(!client.current.getCurrentUserInfo().bVideoOn);
    await renderVideo({
      action: "Start",
      userId: client.current.getCurrentUserInfo().userId,
    });
  };

  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element.remove();
    } else {
      const userVideo = await mediaStream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  const leaveCall = async () => {
    client.current.off(
      "peer-video-state-change",
      (payload: { action: "Start" | "Stop"; userId: number }) =>
        void renderVideo(payload)
    );
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to reset the state
    window.location.href = "/";
    // setInCall(false);
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <h1 className="text-center text-3xl font-bold mb-4 mt-0">
        Session: {session}
      </h1>
      <div className="flex w-full flex-1" style={inCall ? {} : { display: "none" }}>
        {/* @ts-expect-error html component */}
        <video-player-container ref={videoContainerRef} style={videoPlayerStyle} />
      </div>
      {!inCall ? (
        <div className="mx-auto flex w-64 flex-col self-center">
          <div className="w-4" />
          <Button className="flex flex-1" onClick={startCall}>
            Join
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-col justify-around self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            <CameraButton
              client={client}
              isVideoMuted={isVideoMuted}
              setIsVideoMuted={setIsVideoMuted}
              renderVideo={renderVideo}
            />
            <MicButton
              isAudioMuted={isAudioMuted}
              client={client}
              setIsAudioMuted={setIsAudioMuted}
            />
            <Button onClick={leaveCall} title="leave call">
              <PhoneOff />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videocall;

const videoPlayerStyle = {
  height: "75vh",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;
