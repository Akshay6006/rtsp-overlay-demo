import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function App() {
  const videoRef = useRef(null);
  const [overlays, setOverlays] = useState([]);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    const hlsUrl = "http://127.0.0.1:5000/streams/index.m3u8";

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    }

    fetchOverlays();
    const interval = setInterval(fetchOverlays, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverlays = () => {
    fetch("http://127.0.0.1:5000/api/overlays")
      .then((res) => res.json())
      .then((data) => setOverlays(data));
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;

    fetch("http://127.0.0.1:5000/api/overlays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "text",
        content: newText,
        position: { x: 100, y: 100 },
        size: { width: 300, height: 100 },
        opacity: 1,
        rotation: 0,
        zIndex: 5,
      }),
    }).then(fetchOverlays);

    setNewText("");
  };

  const updateOverlay = (id, updates) => {
    fetch(`http://127.0.0.1:5000/api/overlays/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(fetchOverlays);
  };

  const deleteOverlay = (id) => {
    fetch(`http://127.0.0.1:5000/api/overlays/${id}`, {
      method: "DELETE",
    }).then(fetchOverlays);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>RTSP Livestream + Overlays</h1>

      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Video player */}
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{ width: "800px", border: "2px solid black" }}
        ></video>

        {/* Overlay elements */}
        {overlays.map((o) => (
          <div
            key={o.id}
            style={{
              position: "absolute",
              top: o.position.y,
              left: o.position.x,
              width: o.size.width,
              height: o.size.height,
              opacity: o.opacity,
              transform: `rotate(${o.rotation}deg)`,
              zIndex: o.zIndex,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed red", // Debug border
            }}
          >
            {o.type === "text" ? (
              <span
                style={{
                  fontSize: Math.min(o.size.width / 10, o.size.height / 2),
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                  wordWrap: "break-word",
                }}
              >
                {o.content}
              </span>
            ) : (
              <img
                src={o.content}
                alt="overlay"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add new overlay */}
      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add overlay text"
          style={{ padding: "5px", width: "300px" }}
        />
        <button onClick={addTextOverlay} style={{ marginLeft: "10px", padding: "5px 10px" }}>
          Add Text
        </button>
      </div>

      {/* Controls for existing overlays */}
      <div style={{ marginTop: "30px", textAlign: "left", width: "800px", margin: "20px auto" }}>
        <h2>Manage Overlays</h2>
        {overlays.map((o) => (
          <div
            key={o.id}
            style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}
          >
            <p>
              <b>{o.content}</b>
            </p>
            <label>Width: {o.size.width}px</label>
            <input
              type="range"
              min="50"
              max="800"
              value={o.size.width}
              onChange={(e) =>
                updateOverlay(o.id, { size: { ...o.size, width: parseInt(e.target.value) } })
              }
            />
            <br />

            <label>Height: {o.size.height}px</label>
            <input
              type="range"
              min="30"
              max="400"
              value={o.size.height}
              onChange={(e) =>
                updateOverlay(o.id, { size: { ...o.size, height: parseInt(e.target.value) } })
              }
            />
            <br />

            <label>Opacity: {o.opacity}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={o.opacity}
              onChange={(e) => updateOverlay(o.id, { opacity: parseFloat(e.target.value) })}
            />
            <br />

            <label>Rotation: {o.rotation}°</label>
            <input
              type="range"
              min="-180"
              max="180"
              value={o.rotation}
              onChange={(e) => updateOverlay(o.id, { rotation: parseInt(e.target.value) })}
            />
            <br />

            <button
              onClick={() => deleteOverlay(o.id)}
              style={{ marginTop: "10px", background: "red", color: "white", padding: "5px 10px" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
