"use client";
import { CSSProperties, type SetStateAction, type Dispatch, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useVideoState, useAudioState } from "@zoom/videosdk-react";
import { PhoneOff } from "lucide-react";
import { Button } from "./ui/button";
import { useSession, useSessionUsers, VideoPlayerComponent, VideoPlayerContainerComponent } from "@zoom/videosdk-react";

const Container = (props: { slug: string; JWT: string }) => {
  const [inCall, setInCall] = useState(false);
  return inCall ? (
    <Videochat {...props} setInCall={setInCall} />
  ) : (
    <Button onClick={() => setInCall(true)}>Join session</Button>
  )
}

const Videochat = (props: { slug: string; JWT: string, setInCall: Dispatch<SetStateAction<boolean>> }) => {
  const { slug: session, JWT, setInCall } = props;
  const { isLoading, isError, isInSession, error } = useSession(session, JWT, userName);
  const participants = useSessionUsers();
  const { isVideoOn, toggleVideo } = useVideoState();
  const { isAudioMuted, toggleMute } = useAudioState();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.reason}</div>;

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <h1 className="text-center text-3xl font-bold mb-4 mt-0">
        Session: {session}
      </h1>
      <div>
        {isInSession && (
          <VideoPlayerContainerComponent style={videoPlayerStyle}>
            {participants.map(participant => (
              <VideoPlayerComponent
                key={participant.userId}
                user={participant}
              />
            ))}
          </VideoPlayerContainerComponent>
        )}
      </div>
      <div className="flex w-full flex-col justify-around self-center">
        <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
          <Button onClick={() => void toggleVideo()} title="camera">
            {isVideoOn ? <Video /> : <VideoOff />}
          </Button>
          <Button onClick={toggleMute} title="microphone">
            {isAudioMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button onClick={() => setInCall(false)} title="leave session">
            <PhoneOff />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Container;

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
