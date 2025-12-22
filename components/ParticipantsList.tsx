"use client";
import { Users, Circle } from "lucide-react";

interface Participant {
  id: string;
  username: string;
  joinedAt?: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string;
}

export default function ParticipantsList({
  participants,
  currentUserId,
}: ParticipantsListProps) {
  return (
    <div className="h-full flex flex-col backdrop-blur-xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-purple-400" />
          <h2 className="font-bold text-xl text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Participants ({participants.length})
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 hover:bg-slate-600/50 transition-all duration-300 shadow-lg"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg">
                {participant.username.charAt(0).toUpperCase()}
              </div>
              <Circle
                size={12}
                className="absolute -bottom-1 -right-1 fill-green-400 text-green-400 shadow-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">
                {participant.username}
                {participant.id === currentUserId && (
                  <span className="text-xs text-purple-400 ml-2 font-medium">
                    (You)
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
