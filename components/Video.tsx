"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";

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
      peer.on("track", (track: MediaStreamTrack, stream: MediaStream) => {
        track.onended = () => {
          if (track.kind === "audio") setIsAudioEnabled(false);
          if (track.kind === "video") setIsVideoEnabled(false);
        };
        track.onunmute = () => {
          if (track.kind === "audio") setIsAudioEnabled(true);
          if (track.kind === "video") setIsVideoEnabled(true);
        };
      });
    }
  }, [peer]);

  return (
    <div className="relative w-full h-full min-h-[180px] bg-slate-800/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 shadow-purple-500/20">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
        <span className="text-sm font-bold text-white">{username}</span>
        {!isAudioEnabled && <MicOff size={16} className="text-red-400" />}
        {!isVideoEnabled && <VideoOff size={16} className="text-red-400" />}
      </div>
    </div>
  );
}
