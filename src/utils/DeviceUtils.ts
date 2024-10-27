import { VideoClient } from "@zoom/videosdk";

export const switchAudioDevice = async (client: typeof VideoClient, deviceId: string, setCurrentAudioInputDevice: (deviceId: string) => void, addNotification: (message: string) => void) => {
  const mediaStream = client.getMediaStream();
  try {
    await mediaStream.switchMicrophone(deviceId);
    setCurrentAudioInputDevice(deviceId);
    addNotification("已切換音訊輸入設備");
  } catch (error) {
    console.error("切換音訊設備失敗:", error);
    addNotification("切換音訊設備失敗，請重試");
  }
};

export const switchVideoDevice = async (client: typeof VideoClient, deviceId: string, isMobileBrowser: boolean, setCurrentVideoInputDevice: (deviceId: string) => void, addNotification: (message: string) => void) => {
  const mediaStream = client.getMediaStream();
  try {
    await mediaStream.switchCamera(deviceId);
    setCurrentVideoInputDevice(deviceId);
    addNotification("已切換視訊輸入設備");
  } catch (error) {
    console.error("切換視訊設備失敗:", error);
    addNotification("切換視訊設備失敗，請重試");
  }
};

export const switchSpeakerDevice = async (client: typeof VideoClient, deviceId: string, setCurrentAudioOutputDevice: (deviceId: string) => void, addNotification: (message: string) => void) => {
  const mediaStream = client.getMediaStream();
  try {
    await mediaStream.switchSpeaker(deviceId);
    setCurrentAudioOutputDevice(deviceId);
    addNotification("已切換喇叭輸出裝置");
  } catch (error) {
    console.error("切換喇叭設備失敗:", error);
    addNotification("切換喇叭設備失敗，請重試");
  }
};

