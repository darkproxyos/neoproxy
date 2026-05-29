import { io } from "socket.io-client";

// En el futuro podemos usar una variable de entorno como NEXT_PUBLIC_SOCKET_URL
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Logs básicos para debug en desarrollo
if (process.env.NODE_ENV === "development") {
  socket.on("connect", () => {
    console.log("🟢 Socket.IO Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket.IO Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Socket.IO Connection Error:", error);
  });
}
