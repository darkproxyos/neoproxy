"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

type NodeType = "NP-RESIN" | "NP-WEB" | "NP-WIRED" | "UNKNOWN";

export default function NodoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [handshakeStep, setHandshakeStep] = useState(0);
  const [command, setCommand] = useState("");
  const [outputLines, setOutputLines] = useState<string[]>([
    "[NEO·PROXY SYSTEMS] TERMINAL v1.0",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const timer1 = setTimeout(() => setHandshakeStep(1), 500);
      const timer2 = setTimeout(() => setHandshakeStep(2), 2000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [id]);

  const detectNodeType = (nodeId: string): NodeType => {
    if (nodeId.startsWith("NP-RESIN")) return "NP-RESIN";
    if (nodeId.startsWith("NP-WEB")) return "NP-WEB";
    if (nodeId.startsWith("NP-WIRED")) return "NP-WIRED";
    return "UNKNOWN";
  };

  const nodeType = id ? detectNodeType(id) : "UNKNOWN";

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toUpperCase();
    setCommand("");

    let response = "";
    switch (cmd) {
      case "STATUS":
        response = `NODO: ${id}\nTIPO: ${nodeType}\nCOHERENCIA: ESTABLE\nÚLTIMO ACCESO: ${new Date().toLocaleTimeString()}`;
        break;
      case "FORGE":
        response = "SOLICITUD DE FORJA ENVIADA...\n[ERROR] NODE FORGE NO DISPONIBLE EN ESTA TERMINAL. REQUIERE FRAGMENTOS DE COHERENCIA.";
        break;
      case "ENTER":
        if (nodeType === "NP-WIRED") {
          router.push("/games/wired");
          return;
        }
        response = "ACCESO DENEGADO. ESTE NODO NO TIENE CAPA PROFUNDA ASIGNADA.";
        break;
      case "HELP":
        response = "COMANDOS DISPONIBLES: STATUS, FORGE, ENTER, CLEAR, HELP";
        break;
      case "CLEAR":
        setOutputLines(["[NEO·PROXY SYSTEMS] TERMINAL v1.0"]);
        return;
      default:
        response = `COMANDO "${cmd}" NO RECONOCIDO. ESCRIBA HELP PARA LISTA DE COMANDOS.`;
    }

    setOutputLines((prev) => [...prev, `> ${cmd}`, ...response.split("\n")]);
  };

  if (handshakeStep < 2) {
    return (
      <div style={styles.terminal}>
        <p>&gt; ESCANEANDO NODO FÍSICO...</p>
        {handshakeStep >= 1 && <p>&gt; ID DETECTADO: [{id || "???"}]</p>}
        {handshakeStep >= 1 && <p>&gt; VERIFICANDO FIRMA CRIPTOGRÁFICA...</p>}
        {handshakeStep >= 2 && <p>&gt; ACCESO CONCEDIDO.</p>}
      </div>
    );
  }

  return (
    <div style={styles.terminal} onClick={() => inputRef.current?.focus()}>
      <div style={styles.header}>
        [NEO·PROXY SYSTEMS] NODO: {id} // {nodeType}
      </div>
      <div style={styles.output}>
        {outputLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      <div style={styles.prompt}>
        &gt;{" "}
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          style={styles.input}
          autoFocus
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  terminal: {
    backgroundColor: "#000000",
    color: "#CC0000",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontSize: "16px",
    padding: "2rem",
    minHeight: "100vh",
    textShadow: "0 0 5px #FF0000",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    borderBottom: "1px solid #330000",
    paddingBottom: "10px",
    marginBottom: "20px",
    color: "#FF3333",
  },
  output: {
    flex: 1,
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
  },
  prompt: {
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
  },
  input: {
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "1px solid #CC0000",
    color: "#FF3333",
    fontFamily: "inherit",
    fontSize: "16px",
    width: "100%",
    marginLeft: "10px",
    outline: "none",
  },
};
