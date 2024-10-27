import { VideoClient, MediaDevice } from "@zoom/videosdk";

export const setupEventListeners = (client: typeof VideoClient, handlers: {
  handleUserAdded: (payload: any) => void;
  handleUserRemoved: (payload: any) => void;
  handleUserUpdated: (payload: any) => void;
  handleDeviceChange: () => void;
  handleConnectionChange: (payload: any) => void;
}) => {
  client.on("user-added", handlers.handleUserAdded);
  client.on("user-removed", handlers.handleUserRemoved);
  client.on("user-updated", handlers.handleUserUpdated);
  client.on("device-change", handlers.handleDeviceChange);
  client.on("connection-change", handlers.handleConnectionChange);
};

export const cleanupEventListeners = (client: typeof VideoClient, handlers: {
  handleUserAdded: (payload: any) => void;
  handleUserRemoved: (payload: any) => void;
  handleUserUpdated: (payload: any) => void;
  handleDeviceChange: () => void;
  handleConnectionChange: (payload: any) => void;
}) => {
  client.off("user-added", handlers.handleUserAdded);
  client.off("user-removed", handlers.handleUserRemoved);
  client.off("user-updated", handlers.handleUserUpdated);
  client.off("device-change", handlers.handleDeviceChange);
  client.off("connection-change", handlers.handleConnectionChange);
};

export const initializeSession = async (client: typeof VideoClient) => {
  await client.init("en-US", "Global", { patchJsMedia: true });
};

export const joinZoomSession = async (client: typeof VideoClient, session: string, jwt: string, userName: string, password: string) => {
  await client.join(session, jwt, userName, password).catch((e) => {
    console.log(e);
  });
  console.log("成功加入會議");
};

export const setupAudioAndVideo = async (client: typeof VideoClient, setIsAudioMuted: (value: boolean) => void, setIsNoiseSuppressionEnabled: (value: boolean) => void, addNotification: (message: string) => void) => {
  const mediaStream = client.getMediaStream();
  
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

export const updateDeviceStatus = async (client: typeof VideoClient, isMobileBrowser: boolean, setters: {
  setAudioInputDevices: (devices: MediaDevice[]) => void;
  setVideoInputDevices: (devices: MediaDevice[]) => void;
  setAudioOutputDevices: (devices: MediaDevice[]) => void;
  setCurrentAudioInputDevice: (deviceId: string | null) => void;
  setCurrentVideoInputDevice: (deviceId: string | null) => void;
  setCurrentAudioOutputDevice: (deviceId: string | null) => void;
  setIsAudioMuted: (muted: boolean) => void;
  setIsVideoMuted: (muted: boolean) => void;
}) => {
  const mediaStream = client.getMediaStream();
  
  const mics = await mediaStream.getMicList();
  setters.setAudioInputDevices(mics);
  
  let cameras;
  if (isMobileBrowser) {
    const mobileCameras = [
      { deviceId: 'user', label: '前置鏡頭' },
      { deviceId: 'environment', label: '後置鏡頭' }
    ];
    cameras = mobileCameras;
  } else {
    cameras = await mediaStream.getCameraList();
  }
  setters.setVideoInputDevices(cameras);
  
  const speakers = await mediaStream.getSpeakerList();
  setters.setAudioOutputDevices(speakers);
  
  const currentMic = await mediaStream.getActiveMicrophone();
  setters.setCurrentAudioInputDevice(currentMic);
  
  const currentCamera = await mediaStream.getActiveCamera();
  setters.setCurrentVideoInputDevice(currentCamera);
  
  const currentSpeaker = await mediaStream.getActiveSpeaker();
  setters.setCurrentAudioOutputDevice(currentSpeaker);

  const audioState = await mediaStream.isAudioMuted();
  setters.setIsAudioMuted(audioState);
  
  const videoState = await mediaStream.isCapturingVideo();
  setters.setIsVideoMuted(!videoState);
};