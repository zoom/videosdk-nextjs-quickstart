import { useState, useEffect } from 'react';
import { VideoClient, MediaDevice } from "@zoom/videosdk";

export const useDeviceManagement = (
  client: React.MutableRefObject<typeof VideoClient>, 
  inSession: boolean, 
  isMobileBrowser: boolean,
  addNotification: (message: string) => void
) => {
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState<string | null>(null);
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState<string | null>(null);
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(false);

  const updateDeviceStatus = async () => {
    const mediaStream = client.current.getMediaStream();
    
    const mics = await mediaStream.getMicList();
    setAudioInputDevices(mics);
    
    let cameras;
    if (isMobileBrowser) {
      cameras = [
        { deviceId: 'user', label: '前置鏡頭' },
        { deviceId: 'environment', label: '後置鏡頭' }
      ];
    } else {
      cameras = await mediaStream.getCameraList();
    }
    setVideoInputDevices(cameras);
    
    const speakers = await mediaStream.getSpeakerList();
    setAudioOutputDevices(speakers);
    
    const currentMic = await mediaStream.getActiveMicrophone();
    setCurrentAudioInputDevice(currentMic);
    
    const currentCamera = await mediaStream.getActiveCamera();
    setCurrentVideoInputDevice(currentCamera);
    
    const currentSpeaker = await mediaStream.getActiveSpeaker();
    setCurrentAudioOutputDevice(currentSpeaker);

    setIsAudioMuted(await mediaStream.isAudioMuted());
    setIsVideoMuted(!(await mediaStream.isCapturingVideo()));
  };

  const handleSwitchAudioDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.switchMicrophone(deviceId);
      setCurrentAudioInputDevice(deviceId);
      addNotification("已切換音訊輸入設備");
    } catch (error) {
      console.error("切換音訊設備失敗:", error);
      addNotification("切換音訊設備失敗，請重試");
    }
  };

  const handleSwitchVideoDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.switchCamera(deviceId);
      setCurrentVideoInputDevice(deviceId);
      addNotification("已切換視訊輸入設備");
    } catch (error) {
      console.error("切換視訊設備失敗:", error);
      addNotification("切換視訊設備失敗，請重試");
    }
  };

  const handleSwitchSpeakerDevice = async (deviceId: string) => {
    const mediaStream = client.current.getMediaStream();
    try {
      await mediaStream.switchSpeaker(deviceId);
      setCurrentAudioOutputDevice(deviceId);
      addNotification("已切換喇叭輸出裝置");
    } catch (error) {
      console.error("切換喇叭設備失敗:", error);
      addNotification("切換喇叭設備失敗，請重試");
    }
  };

  const handleToggleNoiseSuppression = async () => {
    const mediaStream = client.current.getMediaStream();
    try {
      const newState = !isNoiseSuppressionEnabled;
      await mediaStream.enableBackgroundNoiseSuppression(newState);
      setIsNoiseSuppressionEnabled(newState);
      addNotification(`已${newState ? '開啟' : '關閉'}背景噪音抑制`);
    } catch (error) {
      console.error("切換背景噪音抑制失敗:", error);
      addNotification("切換背景噪音抑制失敗，請重試");
    }
  };

  useEffect(() => {
    if (inSession) {
      updateDeviceStatus();
    }
  }, [inSession]);

  return {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    currentAudioInputDevice,
    currentVideoInputDevice,
    currentAudioOutputDevice,
    isAudioMuted,
    isVideoMuted,
    isNoiseSuppressionEnabled,
    setIsAudioMuted,
    setIsVideoMuted,
    setIsNoiseSuppressionEnabled,
    handleSwitchAudioDevice,
    handleSwitchVideoDevice,
    handleSwitchSpeakerDevice,
    handleToggleNoiseSuppression
  };
}; 