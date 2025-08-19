import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

# Load env vars
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rtsp_overlay")
PORT = int(os.getenv("PORT", "5000"))

# Mongo setup
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
overlays = db.overlays

# Flask app
app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/*": {"origins": "*"}})

# ---------- Utility ----------
def to_overlay_json(doc):
    return {
        "id": str(doc["_id"]),
        "type": doc.get("type", "text"),     # "text" | "logo"
        "content": doc.get("content", ""),   # text or image URL
        "position": doc.get("position", {"x": 100, "y": 100}),
        "size": doc.get("size", {"width": 200, "height": 80}),
        "opacity": doc.get("opacity", 1),
        "rotation": doc.get("rotation", 0),
        "zIndex": doc.get("zIndex", 1),
    }

# ---------- Homepage ----------
@app.get("/")
def home():
    return """
    <html>
        <head>
            <title>RTSP Overlay Backend</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 40px; }
                h1 { color: #2c3e50; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 10px 0; }
                a { text-decoration: none; color: #2980b9; font-size: 18px; }
                a:hover { color: #e74c3c; }
                .footer { margin-top: 40px; font-size: 14px; color: gray; }
            </style>
        </head>
        <body>
            <h1>✅ Backend is running 🚀</h1>
            <p>Here are the available endpoints:</p>
            <ul>
                <li><a href="/api/health">/api/health</a></li>
                <li><a href="/api/overlays">/api/overlays</a></li>
                <li><a href="/streams/index.m3u8">/streams/index.m3u8</a></li>
                <li><a href="/debug/streams">/debug/streams</a></li>
            </ul>
            <div class="footer">Powered by Flask + MongoDB + FFmpeg</div>
        </body>
    </html>
    """

# ---------- Health ----------
@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---------- CRUD Overlays ----------
@app.post("/api/overlays")
def create_overlay():
    data = request.get_json(force=True)
    doc = {
        "type": data.get("type", "text"),
        "content": data.get("content", ""),
        "position": data.get("position", {"x": 100, "y": 100}),
        "size": data.get("size", {"width": 200, "height": 80}),
        "opacity": data.get("opacity", 1),
        "rotation": data.get("rotation", 0),
        "zIndex": data.get("zIndex", 1),
    }
    _id = overlays.insert_one(doc).inserted_id
    created = overlays.find_one({"_id": _id})
    return jsonify(to_overlay_json(created)), 201

@app.get("/api/overlays")
def list_overlays():
    items = [to_overlay_json(doc) for doc in overlays.find({}).sort("zIndex", 1)]
    return jsonify(items)

@app.put("/api/overlays/<id>")
def update_overlay(id):
    data = request.get_json(force=True)
    update = {k: v for k, v in data.items() if k in {
        "type", "content", "position", "size", "opacity", "rotation", "zIndex"
    }}
    overlays.update_one({"_id": ObjectId(id)}, {"$set": update})
    doc = overlays.find_one({"_id": ObjectId(id)})
    if not doc:
        return jsonify({"error": "not found"}), 404
    return jsonify(to_overlay_json(doc))

@app.delete("/api/overlays/<id>")
def delete_overlay(id):
    res = overlays.delete_one({"_id": ObjectId(id)})
    return (jsonify({"deleted": True})
            if res.deleted_count else (jsonify({"error": "not found"}), 404))

# ---------- Serve HLS (FFmpeg output) ----------
HLS_DIR = r"A:\app\backend\streams"

@app.get("/streams/<path:filename>")
def serve_hls(filename):
    full_path = os.path.join(HLS_DIR, filename)
    print("DEBUG: Trying to serve", full_path)

    if os.path.exists(full_path):
        return send_file(full_path)

    if filename.endswith(".m3u8"):
        tmp_path = full_path + ".tmp"
        if os.path.exists(tmp_path):
            return send_file(tmp_path)

    return {
        "error": "file not found",
        "looking_for": full_path,
        "files_in_dir": os.listdir(HLS_DIR)
    }, 404

# ---------- Debug ----------
@app.get("/debug/streams")
def debug_streams():
    return {
        "HLS_DIR": HLS_DIR,
        "absolute_path": os.path.abspath(HLS_DIR),
        "files": os.listdir(HLS_DIR)
    }

# ---------- Run ----------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT, debug=True)
