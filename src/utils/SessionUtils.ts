import { VideoClient } from "@zoom/videosdk";
import { initializeSession, joinZoomSession, setupAudioAndVideo } from './ConferenceUtils';

export const joinSession = async (
  client: typeof VideoClient,
  session: string,
  jwt: string,
  userName: string,
  setIsAudioMuted: (value: boolean) => void,
  setIsNoiseSuppressionEnabled: (value: boolean) => void,
  addNotification: (message: string) => void,
  checkExistingScreenShare: () => Promise<void>,
  setupChatPrivilege: () => Promise<void>,
  setInSession: (value: boolean) => void,
  role: number
) => {
  await initializeSession(client);
  await joinZoomSession(client, session, jwt, userName);
  await setupAudioAndVideo(client, setIsAudioMuted, setIsNoiseSuppressionEnabled, addNotification);
  await checkExistingScreenShare();
  
  // 只有當角色為主持人（假設 role === 1 表示主持人）時才要初始化聊天權限
  if (role === 1) {
    await setupChatPrivilege();
  }
  
  setInSession(true);
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
