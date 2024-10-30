import React from 'react';
import { User, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface Participant {
  userId: string;
  displayName: string;
  isHost: boolean;
  isCoHost: boolean;
  muted: boolean;
  bVideoOn: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUser: Participant | null;
  isVisible: boolean;
  onClose: () => void;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, currentUser, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-16 left-4 bg-white p-4 rounded-md shadow-md w-64 max-h-[80vh] overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">參與者列表</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <ul className="space-y-2">
        {participants.map((participant) => (
          <li key={participant.userId} 
              className={`flex items-center justify-between p-2 rounded-md ${
                participant.userId === currentUser?.userId ? 'bg-blue-100' : ''
              }`}>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                <User size={16} />
              </span>
              <span className="text-sm">
                {participant.displayName}
                {participant.isHost ? ' (主持人)' : participant.isCoHost ? ' (共同主持人)' : ''}
                {participant.userId === currentUser?.userId ? ' (您)' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {participant.muted ? 
                <MicOff className="h-4 w-4" /> : 
                <Mic className="h-4 w-4" />
              }
              {participant.bVideoOn ? 
                <Video className="h-4 w-4" /> : 
                <VideoOff className="h-4 w-4" />
              }
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantsList;