import { VideoClient } from "@zoom/videosdk";
import { initializeSession, joinZoomSession, setupAudioAndVideo } from './ConferenceUtils';

export const joinSession = async (
  client: any,
  session: string,
  jwt: string,
  userName: string,
  password: string | undefined,
  setIsAudioMuted: (muted: boolean) => void,
  setIsNoiseSuppressionEnabled: (enabled: boolean) => void,
  addNotification: (message: string) => void,
  checkExistingScreenShare: () => Promise<void>,
  setupChatPrivilege: () => Promise<void>,
  setInSession: (inSession: boolean) => void,
  role: number
) => {
  try {
    await initializeSession(client);
    await joinZoomSession(client, session, jwt, userName, password ? password.toString() : '');
    await setupAudioAndVideo(client, setIsAudioMuted, setIsNoiseSuppressionEnabled, addNotification);
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

export const leaveSession = async (client: typeof VideoClient, setIsLeavingVoluntarily: (value: boolean) => void) => {
  setIsLeavingVoluntarily(true);
  await client.leave();
  window.location.href = "/";
};

export const endSession = async (client: typeof VideoClient, addNotification: (message: string) => void) => {
  try {
    await client.leave(true);
    addNotification("會話已被主持人結束");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  } catch (error) {
    console.error("結束會話時失敗:", error);
    addNotification("結束會話時失敗，請重試");
  }
};
