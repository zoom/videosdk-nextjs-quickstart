import { VideoClient } from "@zoom/videosdk";

export const useSessionSetup = (
  client: React.MutableRefObject<typeof VideoClient>,
  addNotification: (message: string) => void
) => {
  const initializeSession = async () => {
    await client.current.init("en-US", "Global", { patchJsMedia: true });
  };

  const joinZoomSession = async (session: string, jwt: string, userName: string, password: string) => {
    await client.current.join(session, jwt, userName, password);
    console.log("成功加入會議");
  };

  const setupAudioAndVideo = async (
    setIsAudioMuted: (value: boolean) => void,
    setIsNoiseSuppressionEnabled: (value: boolean) => void
  ) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.startAudio({ backgroundNoiseSuppression: true });
      setIsAudioMuted(false);
      setIsNoiseSuppressionEnabled(true);
    } catch (error) {
      console.error("啟動音訊失敗:", error);
      setIsAudioMuted(true);
      setIsNoiseSuppressionEnabled(false);
      addNotification("無法啟動麥克風，請檢查權限設置");
    }
  };

  const joinSession = async (
    session: string,
    jwt: string,
    userName: string,
    password: string | undefined,
    setIsAudioMuted: (muted: boolean) => void,
    setIsNoiseSuppressionEnabled: (enabled: boolean) => void,
    checkExistingScreenShare: () => Promise<void>,
    setupChatPrivilege: () => Promise<void>,
    setInSession: (inSession: boolean) => void,
    role: number
  ) => {
    try {
      await initializeSession();
      await joinZoomSession(session, jwt, userName, password ? password.toString() : '');
      await setupAudioAndVideo(setIsAudioMuted, setIsNoiseSuppressionEnabled);
      await checkExistingScreenShare();
      if (role === 1) {
        await setupChatPrivilege();
      }
      
      setInSession(true);
    } catch (error) {
      console.error("加入會話失敗:", error);
      addNotification("加入會話失敗，請重試");
    }
  };

  return {
    joinSession,
    setupAudioAndVideo
  };
}; 