"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Reply, X } from "lucide-react";

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

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (
    message: string,
    replyTo?: { sender: string; message: string }
  ) => void;
  currentUsername: string;
}

export default function ChatBox({
  messages,
  onSendMessage,
  currentUsername,
}: ChatBoxProps) {
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    sender: string;
    message: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim(), replyingTo || undefined);
      setInputText("");
      setReplyingTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col backdrop-blur-xl">
      <div className="p-6 border-b border-white/10">
        <h2 className="font-bold text-xl text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Chat
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group relative ${
              msg.sender === currentUsername ? "ml-auto" : "mr-auto"
            } max-w-[85%]`}
          >
            <div
              className={`rounded-2xl p-4 backdrop-blur-sm border ${
                msg.sender === currentUsername
                  ? "bg-gradient-to-br from-purple-600/80 to-pink-600/80 border-purple-400/30 shadow-lg shadow-purple-500/20"
                  : "bg-slate-700/50 border-slate-600/50 shadow-lg"
              }`}
            >
              {msg.sender !== currentUsername && (
                <p className="text-xs font-bold text-purple-400 mb-1">
                  {msg.sender}
                </p>
              )}

              {msg.replyTo && (
                <div className="bg-black/20 rounded-xl p-3 mb-3 border-l-4 border-purple-400">
                  <p className="text-xs text-purple-300 font-medium">
                    {msg.replyTo.sender}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {msg.replyTo.message}
                  </p>
                </div>
              )}

              <p className="text-sm break-words text-white font-medium">
                {msg.message}
              </p>
              <p className="text-[10px] text-slate-300 mt-2 opacity-80">
                {formatTime(msg.timestamp)}
              </p>
            </div>

            <button
              onClick={() =>
                setReplyingTo({ sender: msg.sender, message: msg.message })
              }
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-600/70 hover:bg-slate-500/70 rounded-xl p-2 backdrop-blur-sm border border-white/10"
              title="Reply"
            >
              <Reply size={14} className="text-white" />
            </button>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-white/10">
        {replyingTo && (
          <div className="mb-4 p-4 bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-400 font-medium">
                Replying to {replyingTo.sender}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {replyingTo.message}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-3 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-700/50 backdrop-blur-sm p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 border border-slate-600/50 text-white placeholder-slate-400"
            placeholder="Type a message..."
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed px-6 rounded-2xl transition-all transform hover:scale-105 shadow-lg border border-purple-400/30"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
