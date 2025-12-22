"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Users, MessageSquare } from "lucide-react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const generateRoomId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const id = `${timestamp}-${randomStr}`;
    console.log("Generated room ID:", id); // Debug log
    setRoomId(id);
  };

  const handleJoin = () => {
    if (username.trim() && roomId.trim()) {
      sessionStorage.setItem("username", username.trim());
      router.push(`/room/${roomId.trim()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative">
      {/* Modern animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-800/50 to-pink-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/20 via-purple-600/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-400/20 via-pink-600/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/20 via-blue-600/10 to-transparent"></div>

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-500/25 to-purple-500/25 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl">
                <Video size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  VideoConnect
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Premium Video Calls
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-slate-300 hover:text-purple-300 font-semibold transition-all duration-300 hover:scale-105"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-slate-300 hover:text-purple-300 font-semibold transition-all duration-300 hover:scale-105"
              >
                About
              </a>
              <a
                href="https://gunasekaran-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Portfolio
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-16 min-h-[calc(100vh-160px)] flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-12">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-sm border border-white/20 shadow-2xl">
              <Video size={80} className="text-white drop-shadow-2xl" />
            </div>
            <div>
              <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl mb-4">
                VideoConnect
              </h1>
              <p className="text-xl lg:text-2xl text-slate-300 font-semibold">
                Premium video calls made simple
              </p>
            </div>
          </div>

          <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Connect with anyone, anywhere. High-quality video calls with
            real-time chat, screen sharing, and seamless collaboration - all in
            your browser.
          </p>

          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full shadow-lg"></div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl border border-white/10 shadow-purple-500/20">
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-bold text-white mb-4">
                  👤 Your Name
                </label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-700/50 border border-slate-600/50 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 text-white placeholder-slate-400 font-medium text-lg"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-white mb-4">
                  🏠 Room ID
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    className="flex-1 px-6 py-4 rounded-2xl bg-slate-700/50 border border-slate-600/50 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 text-white placeholder-slate-400 font-medium text-lg"
                    placeholder="Enter or generate room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={generateRoomId}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl transition-all duration-300 font-bold text-white shadow-lg hover:shadow-xl transform hover:scale-105 border border-indigo-500/50 backdrop-blur-sm"
                  >
                    🎲 Generate
                  </button>
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={!username.trim() || !roomId.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed py-5 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl text-white"
              >
                🚀 Join Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">
              ✨ Premium Features
            </h2>
            <p className="text-xl text-slate-300">
              Everything you need for professional video calls
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-purple-600/20 inline-block mb-6 shadow-lg">
                  <Video size={40} className="text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  HD Video & Audio
                </h3>
                <p className="text-slate-400">
                  Crystal clear video quality with noise-canceling audio
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-pink-600/20 inline-block mb-6 shadow-lg">
                  <MessageSquare size={40} className="text-pink-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Real-time Chat
                </h3>
                <p className="text-slate-400">
                  Instant messaging with emoji support and file sharing
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-blue-600/20 inline-block mb-6 shadow-lg">
                  <Users size={40} className="text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Multi-participant
                </h3>
                <p className="text-slate-400">
                  Connect with multiple people simultaneously
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 shadow-2xl mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
                <Video size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">VideoConnect</h3>
                <p className="text-sm text-slate-400">Premium Video Calling</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex items-center gap-6 text-slate-300">
                <span className="text-sm font-semibold">✅ Free</span>
                <span className="text-sm font-semibold">🔒 Secure</span>
                <span className="text-sm font-semibold">
                  📱 No App Required
                </span>
              </div>

              <a
                href="https://gunasekaran-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🔗 My Portfolio
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-slate-400 font-medium">
              © 2025 VideoConnect. Made with ❤️ by{" "}
              <a
                href="https://gunasekaran-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-pink-300 transition-colors duration-300 font-bold underline decoration-2 underline-offset-4"
              >
                Gunasekaran
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
