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
        socketRef.current?.on(
          "user-joined-signal",
          (payload: { signal: any; callerID: string; username: string }) => {
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
          }
        );

        // Handle returned signal
        socketRef.current?.on(
          "receiving-returned-signal",
          (payload: { signal: any; id: string }) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) {
              item.peer.signal(payload.signal);
            }
          }
        );

        // Handle user leaving
        socketRef.current?.on("user-left", (id: string) => {
          const peerObj = peersRef.current.find((p) => p.peerID === id);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
          setPeers((prevPeers) => prevPeers.filter((p) => p.peerID !== id));
        });

        // Handle participants update
        socketRef.current?.on(
          "participants-update",
          (updatedParticipants: Participant[]) => {
            setParticipants(updatedParticipants);
          }
        );

        // Handle new messages
        socketRef.current?.on("new-message", (messageData: Message) => {
          setMessages((prev) => [...prev, messageData]);
        });
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        alert("Unable to access camera/microphone. Please check permissions.");
      });

    return () => {
      // Cleanup
      if (userStream.current) {
        userStream.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => track.stop());
      }
      peersRef.current.forEach((peerObj) => {
        peerObj.peer.destroy();
      });
      socketRef.current?.disconnect();
    };
  }, [roomId, router]);

  function createPeer(
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ): Peer.Instance {
    // ICE servers configuration with STUN and TURN options
    const iceServers = [
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
          username: process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL,
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
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
          },
          {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
          },
          {
            urls: "turn:a.relay.metered.ca:443",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
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
          urls: process.env.NEXT_PUBLIC_CUSTOM_TURN_URL,
          username: process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL,
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
    const iceServers = [
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
          username: process.env.NEXT_PUBLIC_TWILIO_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL,
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
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
          },
          {
            urls: "turn:a.relay.metered.ca:80?transport=tcp",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
          },
          {
            urls: "turn:a.relay.metered.ca:443",
            username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL,
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
          urls: process.env.NEXT_PUBLIC_CUSTOM_TURN_URL,
          username: process.env.NEXT_PUBLIC_CUSTOM_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL,
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
    socketRef.current?.emit("send-message", {
      roomId,
      message,
      sender: username,
      replyTo,
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Room: {roomId}</h1>
              <p className="text-sm text-gray-400">
                {participants.length} participant
                {participants.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-2 rounded-lg transition-colors ${
                  showParticipants
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Toggle Participants"
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-colors ${
                  showChat
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Toggle Chat"
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div
            className={`grid gap-4 h-full ${
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
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-xl border-2 border-blue-500">
              <video
                ref={userVideo}
                muted
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-sm font-medium">{username} (You)</span>
                {!isAudioEnabled && (
                  <MicOff size={14} className="text-red-400" />
                )}
                {!isVideoEnabled && (
                  <VideoOff size={14} className="text-red-400" />
                )}
                {isScreenSharing && (
                  <Monitor size={14} className="text-green-400" />
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
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={isVideoEnabled ? "Stop Video" : "Start Video"}
            >
              {isVideoEnabled ? (
                <VideoIcon size={24} />
              ) : (
                <VideoOff size={24} />
              )}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
            >
              {isScreenSharing ? (
                <MonitorOff size={24} />
              ) : (
                <Monitor size={24} />
              )}
            </button>

            <button
              onClick={leaveCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all transform hover:scale-110"
              title="Leave Call"
            >
              <Phone size={24} className="rotate-135" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Participants & Chat */}
      <div
        className={`transition-all duration-300 ${
          showChat || showParticipants ? "w-96" : "w-0"
        } border-l border-gray-700 flex flex-col overflow-hidden`}
      >
        {showParticipants && (
          <div className="h-1/3 border-b border-gray-700">
            <ParticipantsList
              participants={participants}
              currentUserId={socketRef.current?.id || ""}
            />
          </div>
        )}

        {showChat && (
          <div className={showParticipants ? "h-2/3" : "h-full"}>
            <ChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUsername={username}
            />
          </div>
        )}
      </div>
    </div>
  );
}
