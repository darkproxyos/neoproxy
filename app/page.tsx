export default function Home() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <h1
        style={{
          color: "white",
          fontSize: "6rem",
          fontWeight: 900,
          zIndex: 1,
        }}
      >
        HOLIWI
      </h1>
    </main>
  );
}
