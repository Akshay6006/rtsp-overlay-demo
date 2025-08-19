# 🎥 RTSP Livestream with Overlays

A full-stack project that streams **RTSP video** using FFmpeg, serves it as **HLS (.m3u8)** through a Flask backend, and overlays **text & images** on top of the video in a React frontend.

---

## 🚀 Features
- 🎬 **Live RTSP to HLS streaming** using FFmpeg
- 🖼️ **Dynamic overlays** (Text / Image / Logo)
- 🎛️ Control overlays: position, size, opacity, rotation, zIndex
- 🗑️ Delete overlays anytime
- 🗄️ Overlay metadata stored in **MongoDB**
- ⚛️ **React frontend** with `hls.js` video player
- 🔗 REST APIs for overlays

---

## 🛠️ Tech Stack
**Frontend:**
- React + Hls.js
- Tailwind CSS (optional)

**Backend:**
- Flask + Flask-CORS
- MongoDB
- FFmpeg (for video streaming)

---

## 📂 Project Structure
app/
│── backend/ # Flask backend
│ ├── app.py # Main Flask app
│ ├── streams/ # FFmpeg outputs (.m3u8 + .ts)
│ └── .env # MongoDB URL, PORT
│
│── frontend/ # React frontend
│ ├── src/App.js # Video player + overlay UI
│ ├── package.json
│ └── ...
│
├── README.md # Project documentation
└── .gitignore


---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
git clone https://github.com/<your-username>/<your-repo>.git

2️⃣ Backend Setup (Flask + FFmpeg)


cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
Run backend:


python app.py
Check health:
👉 http://127.0.0.1:5000/api/health

3️⃣ Start FFmpeg (Sample Video Stream)

ffmpeg -re -stream_loop -1 -i sample.mp4 \
  -c:v libx264 -preset veryfast -tune zerolatency \
  -c:a aac -f hls -hls_time 2 -hls_list_size 5 \
  -hls_flags delete_segments streams/index.m3u8
4️⃣ Frontend Setup (React)

cd frontend
npm install
npm start
Then open 👉 http://localhost:3000

📡 API Endpoints
GET /api/health → Check backend status

GET /api/overlays → List overlays

POST /api/overlays → Create overlay

PUT /api/overlays/:id → Update overlay

DELETE /api/overlays/:id → Delete overlay

GET /streams/index.m3u8 → Video stream

🎮 Demo Flow
Start backend (python app.py)

Start FFmpeg (creates .m3u8 + .ts files in streams/)

Start frontend (npm start)

Add overlays → They appear instantly on video



📝 License
MIT License © 2025 Akshay Kumar

