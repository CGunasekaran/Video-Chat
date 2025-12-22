"use client";
import { Users, Circle } from 'lucide-react';

interface Participant {
  id: string;
  username: string;
  joinedAt?: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string;
}

export default function ParticipantsList({ participants, currentUserId }: ParticipantsListProps) {
  return (
    <div className="h-full flex flex-col bg-gray-800/50">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          <h2 className="font-semibold text-lg">Participants ({participants.length})</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((participant) => (
          <div 
            key={participant.id}
            className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-semibold">
                {participant.username.charAt(0).toUpperCase()}
              </div>
              <Circle 
                size={10} 
                className="absolute bottom-0 right-0 fill-green-500 text-green-500" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {participant.username}
                {participant.id === currentUserId && (
                  <span className="text-xs text-blue-400 ml-2">(You)</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
