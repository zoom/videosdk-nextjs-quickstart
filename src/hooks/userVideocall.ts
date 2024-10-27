import { useState, useEffect } from 'react';
import { VideoClient, MediaDevice } from "@zoom/videosdk";
import { updateDeviceStatus } from '../utils/ConferenceUtils';

export const useDevices = (client: React.MutableRefObject<typeof VideoClient>, inSession: boolean, isMobileBrowser: boolean) => {
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [currentAudioInputDevice, setCurrentAudioInputDevice] = useState<string | null>(null);
  const [currentVideoInputDevice, setCurrentVideoInputDevice] = useState<string | null>(null);
  const [currentAudioOutputDevice, setCurrentAudioOutputDevice] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  useEffect(() => {
    if (inSession) {
      updateDeviceStatus(client.current, isMobileBrowser, {
        setAudioInputDevices,
        setVideoInputDevices,
        setAudioOutputDevices,
        setCurrentAudioInputDevice,
        setCurrentVideoInputDevice,
        setCurrentAudioOutputDevice,
        setIsAudioMuted,
        setIsVideoMuted
      });
    }
  }, [inSession, isMobileBrowser]);

  return {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    currentAudioInputDevice,
    currentVideoInputDevice,
    currentAudioOutputDevice,
    isAudioMuted,
    isVideoMuted,
    setIsAudioMuted,
    setIsVideoMuted,
    setCurrentAudioInputDevice,
    setCurrentVideoInputDevice,
    setCurrentAudioOutputDevice
  };
};

export const useParticipants = (client: React.MutableRefObject<typeof VideoClient>, inSession: boolean) => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const updateParticipantsList = () => {
    try {
      const users = client.current.getAllUser();
      setParticipants(users);
      const current = client.current.getCurrentUserInfo();
      setCurrentUser(current);
    } catch (error) {
      console.error("更新參與者列表時出錯:", error);
    }
  };

  useEffect(() => {
    if (inSession) {
      updateParticipantsList();
    }
  }, [inSession]);

  return { participants, currentUser, updateParticipantsList };
};