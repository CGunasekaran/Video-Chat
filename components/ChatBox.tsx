"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Reply, X } from 'lucide-react';

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
  onSendMessage: (message: string, replyTo?: { sender: string; message: string }) => void;
  currentUsername: string;
}

export default function ChatBox({ messages, onSendMessage, currentUsername }: ChatBoxProps) {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ sender: string; message: string } | null>(null);
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
      setInputText('');
      setReplyingTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800/50">
      <div className="p-4 border-b border-gray-700">
        <h2 className="font-semibold text-lg">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`group relative ${
              msg.sender === currentUsername ? 'ml-auto' : 'mr-auto'
            } max-w-[85%]`}
          >
            <div className={`rounded-lg p-3 ${
              msg.sender === currentUsername 
                ? 'bg-blue-600' 
                : 'bg-gray-700'
            }`}>
              {msg.sender !== currentUsername && (
                <p className="text-xs font-semibold text-blue-400 mb-1">
                  {msg.sender}
                </p>
              )}
              
              {msg.replyTo && (
                <div className="bg-black/20 rounded p-2 mb-2 border-l-2 border-gray-400">
                  <p className="text-xs text-gray-300">{msg.replyTo.sender}</p>
                  <p className="text-xs text-gray-400 truncate">{msg.replyTo.message}</p>
                </div>
              )}
              
              <p className="text-sm break-words">{msg.message}</p>
              <p className="text-[10px] text-gray-300 mt-1">
                {formatTime(msg.timestamp)}
              </p>
            </div>

            <button
              onClick={() => setReplyingTo({ sender: msg.sender, message: msg.message })}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 hover:bg-gray-500 rounded p-1"
              title="Reply"
            >
              <Reply size={12} />
            </button>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-700 rounded flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-400">Replying to {replyingTo.sender}</p>
              <p className="text-xs text-gray-400 truncate">{replyingTo.message}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-gray-700 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Type a message..."
            maxLength={500}
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
