"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import Peer from "simple-peer";
import Video from "@/components/Video";
import ChatBox from "@/components/ChatBox";
import ParticipantsList from "@/components/ParticipantsList";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
  Monitor,
  MonitorOff,
} from "lucide-react";

interface PeerData {
  peerID: string;
  peer: Peer.Instance;
  username: string;
}

interface Participant {
  id: string;
  username: string;
  joinedAt?: string;
}

interface Message {
  id: number;
  sender: string;
  message: string;
  replyTo?: {
    sender: string;
    message: string;
  } | null;
  timestamp: string;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";

export default function Room() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [peers, setPeers] = useState<PeerData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [username, setUsername] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);

  const socketRef = useRef<Socket>();
  const userVideo = useRef<HTMLVideoElement>(null);
  const userStream = useRef<MediaStream>();
  const screenStream = useRef<MediaStream>();
  const peersRef = useRef<PeerData[]>([]);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (!storedUsername) {
      router.push("/");
      return;
    }
    setUsername(storedUsername);

    // Initialize socket connection
    socketRef.current = io(SOCKET_SERVER_URL);

    // Get user media
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      .then((stream) => {
        userStream.current = stream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        // Join room
        socketRef.current?.emit("join-room", {
          roomId,
          username: storedUsername,
        });

        // Handle existing users
        socketRef.current?.on("existing-users", (users: Participant[]) => {
          const newPeers: PeerData[] = [];
          const socketId = socketRef.current?.id;
          if (!socketId) return;

          users.forEach((user) => {
            const peer = createPeer(user.id, socketId, stream);
            peersRef.current.push({
              peerID: user.id,
              peer,
              username: user.username,
            });
            newPeers.push({
              peerID: user.id,
              peer,
              username: user.username,
            });
          });
          setPeers(newPeers);
        });

        // Handle new user joining
        const handleUserJoined = (payload: {
          signal: any;
          callerID: string;
          username: string;
        }) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            username: payload.username,
          });

          setPeers((prevPeers) => [
            ...prevPeers,
            {
              peerID: payload.callerID,
              peer,
              username: payload.username,
            },
          ]);
        };

        // Handle returned signal
        const handleReturnedSignal = (payload: { signal: any; id: string }) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        };

        // Handle user leaving
        const handleUserLeft = (id: string) => {
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
          setPeers((prevPeers) => prevPeers.filter((p) => p.peerID !== id));
        };

        socketRef.current?.on("user-joined-signal", handleUserJoined);
        socketRef.current?.on(
          "receiving-returned-signal",
          handleReturnedSignal
        );
        socketRef.current?.on("user-left", handleUserLeft);

        // Handle participants update
        const handleParticipantsUpdate = (
          updatedParticipants: Participant[]
        ) => {
          // Deduplicate participants by ID to prevent duplicate entries
          const uniqueParticipants = updatedParticipants.filter(
            (participant, index, arr) =>
              arr.findIndex((p) => p.id === participant.id) === index
          );
          setParticipants(uniqueParticipants);
        };

        // Handle new messages
        const handleNewMessage = (messageData: Message) => {
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some((msg) => msg.id === messageData.id);
            if (messageExists) {
              return prev;
            }
            return [...prev, messageData];
          });
        };

        socketRef.current?.on("participants-update", handleParticipantsUpdate);
        socketRef.current?.on("new-message", handleNewMessage);
      })
      .catch((err) => {
        console.error("Error is accessing media devices:", err);
        alert("Unable to access camera/microphone. Please check permissions.");
      });

    return () => {
      // Cleanup socket event listeners
      if (socketRef.current) {
        socketRef.current.off("user-joined-signal");
        socketRef.current.off("receiving-returned-signal");
        socketRef.current.off("user-left");
        socketRef.current.off("participants-update");
        socketRef.current.off("new-message");
        socketRef.current.off("existing-users");
        socketRef.current.disconnect();
      }

      // Cleanup media streams
      if (userStream.current) {
        userStream.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => track.stop());
      }

      // Cleanup peer connections
      peersRef.current.forEach((peerObj) => {
        peerObj.peer.destroy();
      });
    };
  }, [roomId, router]);

  function createPeer(
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ): Peer.Instance {
    // ICE servers configuration with STUN and TURN options
    const iceServers: RTCIceServer[] = [
      // STUN servers (free, for basic NAT traversal)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    // Add TURN servers if configured (required for strict firewalls)
    if (process.env.NEXT_PUBLIC_ENABLE_TURN_SERVERS === "true") {
      // Twilio TURN servers
      if (
        process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL
      ) {
        iceServers.push({
          urls: "turn:global.turn.twilio.com:3478?transport=udp",
          username: process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL!,
        });
      }

      // Metered.ca TURN servers
      if (
        process.env.NEXT_PUBLIC_METERED_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL
      ) {
        iceServers.push(
          {
            urls: "turn:a.relay.metered.ca:80",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          },
          {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          },
          {
            urls: "turn:a.relay.metered.ca:443",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          }
        );
      }

      // Custom TURN server (e.g., self-hosted Coturn)
      if (
        process.env.NEXT_PUBLIC_CUSTOM_TURN_URL &&
        process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL
      ) {
        iceServers.push({
          urls: process.env.NEXT_PUBLIC_CUSTOM_TURN_URL!,
          username: process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL!,
        });
      }
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers,
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        username,
      });
    });

    return peer;
  }

  function addPeer(
    incomingSignal: any,
    callerID: string,
    stream: MediaStream
  ): Peer.Instance {
    // ICE servers configuration with STUN and TURN options
    const iceServers: RTCIceServer[] = [
      // STUN servers (free, for basic NAT traversal)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    // Add TURN servers if configured (required for strict firewalls)
    if (process.env.NEXT_PUBLIC_ENABLE_TURN_SERVERS === "true") {
      // Twilio TURN servers
      if (
        process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL
      ) {
        iceServers.push({
          urls: "turn:global.turn.twilio.com:3478?transport=udp",
          username: process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL!,
        });
      }

      // Metered.ca TURN servers
      if (
        process.env.NEXT_PUBLIC_METERED_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL
      ) {
        iceServers.push(
          {
            urls: "turn:a.relay.metered.ca:80",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          },
          {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          },
          {
            urls: "turn:a.relay.metered.ca:443",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME!,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL!,
          }
        );
      }

      // Custom TURN server (e.g., self-hosted Coturn)
      if (
        process.env.NEXT_PUBLIC_CUSTOM_TURN_URL &&
        process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME &&
        process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL
      ) {
        iceServers.push({
          urls: process.env.NEXT_PUBLIC_CUSTOM_TURN_URL!,
          username: process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME!,
          credential: process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL!,
        });
      }
    }

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers,
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const toggleAudio = () => {
    if (userStream.current) {
      const audioTrack = userStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (userStream.current) {
      const videoTrack = userStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        screenStream.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        if (userStream.current) {
          const sender = peersRef.current[0]?.peer;
          // Replace video track with screen track for all peers
          peersRef.current.forEach((peerObj) => {
            const senders = (peerObj.peer as any)._pc.getSenders();
            const videoSender = senders.find(
              (sender: RTCRtpSender) => sender.track?.kind === "video"
            );
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
          });
        }

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }

    if (userStream.current) {
      const videoTrack = userStream.current.getVideoTracks()[0];
      peersRef.current.forEach((peerObj) => {
        const senders = (peerObj.peer as any)._pc.getSenders();
        const videoSender = senders.find(
          (sender: RTCRtpSender) => sender.track?.kind === "video"
        );
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
      });
    }

    setIsScreenSharing(false);
  };

  const leaveCall = () => {
    if (userStream.current) {
      userStream.current.getTracks().forEach((track) => track.stop());
    }
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current?.disconnect();
    router.push("/");
  };

  const handleSendMessage = (
    message: string,
    replyTo?: { sender: string; message: string }
  ) => {
    const messageId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    socketRef.current?.emit("send-message", {
      roomId,
      message,
      sender: username,
      replyTo,
      messageId,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Modern animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-800/50 to-pink-800/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/20 via-purple-600/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-400/20 via-pink-600/10 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/20 via-blue-600/10 to-transparent"></div>
        </div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-500/25 to-purple-500/25 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex h-screen">
        {/* Left Side - Video Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-slate-800/40 backdrop-blur-xl px-6 py-4 border-b border-white/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-sm border border-white/20">
                  <VideoIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Room: {roomId}
                  </h1>
                  <p className="text-sm text-slate-300">
                    {participants.length} participant
                    {participants.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    showParticipants
                      ? "bg-purple-600/30 border-purple-400/50"
                      : "bg-slate-700/30 border-slate-600/50"
                  } border backdrop-blur-sm`}
                  title="Toggle Participants"
                >
                  <Users size={20} className="text-white" />
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    showChat
                      ? "bg-purple-600/30 border-purple-400/50"
                      : "bg-slate-700/30 border-slate-600/50"
                  } border backdrop-blur-sm`}
                  title="Toggle Chat"
                >
                  <MessageSquare size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div
              className={`grid gap-6 h-full ${
                peers.length === 0
                  ? "grid-cols-1"
                  : peers.length === 1
                  ? "grid-cols-2"
                  : peers.length <= 4
                  ? "grid-cols-2"
                  : peers.length <= 9
                  ? "grid-cols-3"
                  : "grid-cols-4"
              }`}
            >
              {/* Current User Video */}
              <div className="relative aspect-video bg-slate-800/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 shadow-purple-500/20">
                <video
                  ref={userVideo}
                  muted
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
                  <span className="text-sm font-bold text-white">
                    {username} (You)
                  </span>
                  {!isAudioEnabled && (
                    <MicOff size={16} className="text-red-400" />
                  )}
                  {!isVideoEnabled && (
                    <VideoOff size={16} className="text-red-400" />
                  )}
                  {isScreenSharing && (
                    <Monitor size={16} className="text-green-400" />
                  )}
                </div>
              </div>

              {/* Other Participants */}
              {peers.map((peerObj) => (
                <Video
                  key={peerObj.peerID}
                  peer={peerObj.peer}
                  username={peerObj.username}
                />
              ))}
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-slate-800/40 backdrop-blur-xl px-6 py-6 border-t border-white/10 shadow-lg">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                  isAudioEnabled
                    ? "bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/50"
                    : "bg-red-600/80 hover:bg-red-500/80 border-red-400/50"
                } border backdrop-blur-sm`}
                title={isAudioEnabled ? "Mute" : "Unmute"}
              >
                {isAudioEnabled ? (
                  <Mic size={24} className="text-white" />
                ) : (
                  <MicOff size={24} className="text-white" />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                  isVideoEnabled
                    ? "bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/50"
                    : "bg-red-600/80 hover:bg-red-500/80 border-red-400/50"
                } border backdrop-blur-sm`}
                title={isVideoEnabled ? "Stop Video" : "Start Video"}
              >
                {isVideoEnabled ? (
                  <VideoIcon size={24} className="text-white" />
                ) : (
                  <VideoOff size={24} className="text-white" />
                )}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                  isScreenSharing
                    ? "bg-purple-600/80 hover:bg-purple-500/80 border-purple-400/50"
                    : "bg-slate-700/50 hover:bg-slate-600/50 border-slate-500/50"
                } border backdrop-blur-sm`}
                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              >
                {isScreenSharing ? (
                  <MonitorOff size={24} className="text-white" />
                ) : (
                  <Monitor size={24} className="text-white" />
                )}
              </button>

              <button
                onClick={leaveCall}
                className="p-4 rounded-2xl bg-red-600/80 hover:bg-red-500/80 transition-all duration-300 transform hover:scale-110 shadow-lg border border-red-400/50 backdrop-blur-sm"
                title="Leave Call"
              >
                <Phone size={24} className="rotate-135 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat & Participants */}
        <div
          className={`transition-all duration-300 ${
            showChat || showParticipants ? "w-96" : "w-0"
          } flex flex-col overflow-hidden`}
        >
          {showParticipants && (
            <div className="h-1/3 bg-slate-800/40 backdrop-blur-xl border-b border-white/10">
              <ParticipantsList
                participants={participants}
                currentUserId={socketRef.current?.id || ""}
              />
            </div>
          )}

          {showChat && (
            <div
              className={`${
                showParticipants ? "h-2/3" : "h-full"
              } bg-slate-800/40 backdrop-blur-xl`}
            >
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUsername={username}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
