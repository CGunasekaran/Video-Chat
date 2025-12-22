const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store rooms and their users
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Check if user is already in the room to prevent duplicates
    const existingUserIndex = rooms[roomId].findIndex(
      (u) => u.id === socket.id
    );
    if (existingUserIndex !== -1) {
      // User already in room, just send existing users
      const existingUsers = rooms[roomId].filter((u) => u.id !== socket.id);
      socket.emit("existing-users", existingUsers);
      socket.emit("participants-update", rooms[roomId]);
      return;
    }

    // Add user to room
    const user = {
      id: socket.id,
      username: username || "Anonymous",
      joinedAt: new Date().toISOString(),
    };

    rooms[roomId].push(user);
    socket.join(roomId);

    console.log(`${username} joined room ${roomId}`);

    // Send list of all existing users to the new user
    const existingUsers = rooms[roomId].filter((u) => u.id !== socket.id);
    socket.emit("existing-users", existingUsers);

    // Notify all other users in the room about the new user
    socket.to(roomId).emit("user-joined", user);

    // Send updated participant list to everyone
    io.to(roomId).emit("participants-update", rooms[roomId]);
  });

  // WebRTC signaling
  socket.on(
    "sending-signal",
    ({ userToSignal, callerID, signal, username }) => {
      io.to(userToSignal).emit("user-joined-signal", {
        signal,
        callerID,
        username,
      });
    }
  );

  socket.on("returning-signal", ({ callerID, signal }) => {
    io.to(callerID).emit("receiving-returned-signal", {
      id: socket.id,
      signal,
    });
  });

  // Chat messages
  socket.on("send-message", ({ roomId, message, sender, replyTo }) => {
    const messageData = {
      id: Date.now(),
      sender,
      message,
      replyTo: replyTo || null,
      timestamp: new Date().toISOString(),
    };

    io.to(roomId).emit("new-message", messageData);
  });

  // Handle disconnection
  socket.on("disconnecting", () => {
    const roomsToClean = Array.from(socket.rooms);

    roomsToClean.forEach((roomId) => {
      if (rooms[roomId]) {
        const disconnectedUser = rooms[roomId].find((u) => u.id === socket.id);

        // Remove user from room
        rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);

        // Clean up empty rooms
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        } else {
          // Notify others about the disconnection
          socket.to(roomId).emit("user-left", socket.id);
          io.to(roomId).emit("participants-update", rooms[roomId]);
        }

        if (disconnectedUser) {
          console.log(`${disconnectedUser.username} left room ${roomId}`);
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
