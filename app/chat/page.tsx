"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  {
    transports: ["websocket"],
  }
);

type Message = {
  id: string;
  text: string;
  ts: number;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      setMyId(socket.id || "");
    });

    socket.on("chat_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("connect");
      socket.off("chat_message");
    };
  }, []);

  const send = () => {
    if (!text.trim()) return;

    socket.emit("chat_message", text);

    setText("");
  };

  return (
    <main
      style={{
        height: "100vh",
        background: "#050505",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px",
          color: "#00ffff",
          fontWeight: 700,
          borderBottom: "1px solid #222",
        }}
      >
        NeoProxy Realtime Chat
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}
      >
        {messages.map((msg, i) => {
          const mine = msg.id === myId;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: mine
                  ? "flex-end"
                  : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: mine
                    ? "#00bcd4"
                    : "#1b1b1b",
                  color: "white",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "12px",
          borderTop: "1px solid #222",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Escribe..."
          style={{
            flex: 1,
            padding: "12px",
            background: "#111",
            color: "white",
            border: "1px solid #333",
            outline: "none",
          }}
        />

        <button
          onClick={send}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </main>
  );
}
