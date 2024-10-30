import React from 'react';
import { MediaDevice } from '@zoom/videosdk';

interface DeviceManagerProps {
  audioInputDevices: MediaDevice[];
  videoInputDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  currentAudioInputDevice: string | null;
  currentVideoInputDevice: string | null;
  currentAudioOutputDevice: string | null;
  switchAudioDevice: (deviceId: string) => void;
  switchVideoDevice: (deviceId: string) => void;
  switchSpeakerDevice: (deviceId: string) => void;
} 

const DeviceManager: React.FC<DeviceManagerProps> = ({
  audioInputDevices,
  videoInputDevices,
  audioOutputDevices,
  currentAudioInputDevice,
  currentVideoInputDevice,
  currentAudioOutputDevice,
  switchAudioDevice,
  switchVideoDevice,
  switchSpeakerDevice,
}) => {
  return (
    <div className="mt-4 flex w-full max-w-2xl justify-center space-x-4">
      <div>
        <select
          value={currentAudioInputDevice || ''}
          onChange={(e) => switchAudioDevice(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">選擇音訊設備</option>
          {audioInputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `音訊設備 ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={currentVideoInputDevice || ''}
          onChange={(e) => switchVideoDevice(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">選擇視訊設備</option>
          {videoInputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `視訊設備 ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={currentAudioOutputDevice || ''}
          onChange={(e) => switchSpeakerDevice(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">選擇喇叭設備</option>
          {audioOutputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `喇叭設備 ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DeviceManager;
