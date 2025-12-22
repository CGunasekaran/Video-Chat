"use client";
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';

interface VideoProps {
  peer: any;
  username: string;
}

export default function Video({ peer, username }: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    if (peer) {
      peer.on("stream", (stream: MediaStream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      });

      // Listen for track events to detect mute/unmute
      peer.on('track', (track: MediaStreamTrack, stream: MediaStream) => {
        track.onended = () => {
          if (track.kind === 'audio') setIsAudioEnabled(false);
          if (track.kind === 'video') setIsVideoEnabled(false);
        };
        track.onunmute = () => {
          if (track.kind === 'audio') setIsAudioEnabled(true);
          if (track.kind === 'video') setIsVideoEnabled(true);
        };
      });
    }
  }, [peer]);

  return (
    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
        <span className="text-sm font-medium text-white">{username}</span>
        {!isAudioEnabled && <MicOff size={14} className="text-red-400" />}
        {!isVideoEnabled && <VideoOff size={14} className="text-red-400" />}
      </div>
    </div>
  );
}
