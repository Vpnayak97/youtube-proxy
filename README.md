# YouTube Proxy Player - Complete Setup Guide

## 📁 Project Structure

```
youtube-proxy-player/
├── server.js              # Backend - API server (search, stream)
├── package.json           # Node dependencies
├── public/
│   └── index.html        # Frontend - YouTube-like UI
├── videos/               # Downloaded videos (auto-deleted after 1 hour)
├── .env                  # Environment variables (optional)
├── Procfile              # Cloud deployment config
└── README.md
```

---

## 🎯 How It Works

**User never hits youtube.com directly:**

1. **Search:** User types → request goes to YOUR SERVER → server searches YouTube → shows results
2. **Play:** User clicks video → request goes to YOUR SERVER → server downloads from YouTube → streams to user
3. **Stream:** All video data flows through YOUR SERVER, not directly from YouTube

```
User Browser → Your Server → YouTube.com
User Browser ← Your Server ← YouTube.com
```

---

## ⚙️ Step 1: Local Setup (VS Code)

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org)
- **yt-dlp** - [Install Guide](https://github.com/yt-dlp/yt-dlp/wiki/Installation)

**Windows Installation:**
```bash
# Download yt-dlp.exe from: https://github.com/yt-dlp/yt-dlp/releases
# Place in C:\yt-dlp.exe (or add to PATH)

# Or use Python:
pip install yt-dlp
```

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo apt-get install yt-dlp
```

### Local Setup Steps

1. **Create project folder:**
   ```bash
   mkdir youtube-proxy-player
   cd youtube-proxy-player
   ```

2. **Copy these files into the folder:**
   - `server.js`
   - `package.json`
   - `public/index.html`
   - `Procfile`

3. **Create `.env` file (optional, for Windows):**
   ```
   YTDLP_PATH=C:\yt-dlp.exe
   PORT=3000
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Test locally:**
   ```bash
   npm start
   ```

6. **Open browser:**
   ```
   http://localhost:3000
   ```

✅ Search for videos, click to play!

---

## 🌐 Step 2: Deploy to Render (Free Cloud)

Render hosts your backend server. Frontend can stay on Render or use Netlify (see below).

### 2A. Push code to GitHub

```bash
cd youtube-proxy-player
git init
git add .
git commit -m "YouTube proxy player"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youtube-proxy-player.git
git push -u origin main
```

### 2B. Deploy Backend on Render

1. Go to [render.com](https://render.com) → Sign up (free)

2. Click **"New +"** → **"Web Service"**

3. **Connect GitHub:**
   - Select your `youtube-proxy-player` repo

4. **Configuration:**
   - **Name:** `youtube-proxy-player`
   - **Environment:** `Node`
   - **Build Command:**
     ```
     npm install && apt-get update && apt-get install -y yt-dlp ffmpeg
     ```
   - **Start Command:** `node server.js`
   - **Port:** `3000`

5. **Environment Variables:**
   - **Key:** `YTDLP_PATH`
   - **Value:** `yt-dlp` (Linux, already installed via build command)

6. Click **"Create Web Service"**

⏳ Wait 3-5 minutes. Your backend URL appears:
```
https://youtube-proxy-player.onrender.com
```

---

## 🎨 Step 3: Deploy Frontend (Two Options)

### Option A: Frontend on Render (Easiest)

Your frontend is already included! Just update it to use the backend URL.

1. Edit `public/index.html` line with `API_BASE`:
   ```javascript
   const API_BASE = 'https://youtube-proxy-player.onrender.com';
   ```

2. Commit and push:
   ```bash
   git add public/index.html
   git commit -m "Update API base URL"
   git push
   ```

3. Render auto-deploys. Visit:
   ```
   https://youtube-proxy-player.onrender.com
   ```

✅ Done! Frontend and backend on same Render domain.

### Option B: Frontend on Netlify (Recommended for Speed)

Netlify serves frontend faster globally, your Render backend serves API.

1. **Create `public/index.html` locally** with backend URL:
   ```javascript
   const API_BASE = 'https://youtube-proxy-player.onrender.com';
   ```

2. **Deploy to Netlify:**
   ```bash
   # If you have Netlify CLI installed:
   netlify deploy --prod --dir=public
   ```

   **Or manually:**
   - Go to [netlify.com](https://netlify.com) → Sign up (free)
   - Drag & drop `public/index.html` into Netlify
   - Your frontend gets a URL like: `https://xyz123.netlify.app`

✅ Frontend on Netlify, backend on Render, everything works!

---

## 🧪 Testing

### Local:
```bash
npm start
# Visit http://localhost:3000
# Search: "javascript tutorial"
# Click a video to play
```

### Production:
```
Frontend: https://yoursite.netlify.app
Backend: https://youtube-proxy-player.onrender.com
Search a video → all requests go to your server → server talks to YouTube
```

**Network trace (from browser):**
- ✅ `POST yoursite.netlify.app/api/search` (your server handles it)
- ✅ `GET your-backend.onrender.com/api/stream/videoId` (your server streams)
- ❌ Browser never directly contacts `youtube.com`

---

## 📊 API Endpoints

All requests go through **your backend only:**

### 1. Search
```
POST /api/search
Body: { "query": "javascript", "maxResults": 30 }
Response: [ { videoId, title, thumbnail, duration, uploader, ... } ]
```

### 2. Stream Video
```
GET /api/stream/:videoId
Response: MP4 video stream (supports range requests for seeking)
```

### 3. Video Info
```
GET /api/video-info/:videoId
Response: { title, description, duration, uploader, ... }
```

### 4. Health Check
```
GET /health
Response: { status: "ok" }
```

---

## ⚙️ Environment Variables

Create `.env` file for local dev:

```
PORT=3000
YTDLP_PATH=yt-dlp
```

On Render, set in dashboard:
- `PORT` → `3000`
- `YTDLP_PATH` → `yt-dlp`

---

## 🔧 Configuration

**Video auto-delete:** Edit `server.js`
```javascript
const VIDEO_LIFETIME = 60 * 60 * 1000; // 1 hour
```

**Video quality:** Edit download command in `server.js`
```javascript
const command = `${YTDLP_PATH} -f "best[ext=mp4]/best" -o "${filepath}" "${url}"`;
// -f "best[ext=mp4]/best"  = highest quality MP4
// -f "22"                   = 1280x720 (smaller)
// -f "18"                   = 360p (smallest)
```

---

## ⚠️ Important Legal Notes

**This is a YouTube proxy:**
- Your server acts as an intermediary between user and YouTube
- User never directly contacts YouTube (bypasses network blocks)
- This violates YouTube ToS if deployed publicly
- **For private college project/demonstration only**

**Keep it private:**
- Don't share the URL publicly
- Single-user, internal demo
- Show only to professor
- Delete after demonstration

**For public/production use:**
- Use official YouTube Player API (iframe embed) instead
- Host on official YouTube channels
- Comply with YouTube Terms of Service

---

## 🐛 Troubleshooting

**"yt-dlp not found"**
- Linux: `apt-get install yt-dlp`
- macOS: `brew install yt-dlp`
- Windows: Download from GitHub or set `YTDLP_PATH` env var

**Search returns no results**
- Check internet connection
- Try different search query
- Verify yt-dlp works locally: `yt-dlp "ytsearch1:javascript" --dump-json`

**Video won't play**
- Check browser network tab
- Ensure backend URL is correct
- Try different video
- Backend might be sleeping (Render free tier) - refresh

**"CORS error"**
- Frontend and backend domains don't match
- Edit `API_BASE` in `public/index.html` to your backend URL
- Ensure `cors` package is installed

**Render goes to sleep**
- Free tier spins down after 15 min inactivity
- First request wakes it up (~30 sec)
- Use Render paid tier for always-on

---

## 📈 Performance Tips

1. **Render Performance:**
   - Search caches results (fast)
   - Videos cached after first play
   - Auto-delete after 1 hour saves storage

2. **Frontend Performance:**
   - Netlify CDN makes it fast globally
   - Lazy load thumbnails
   - Video player streams (doesn't pre-load)

3. **Optimization:**
   - Reduce video quality if slow
   - Limit search results to 20 (faster)
   - Add database later for search caching

---

## 📚 Resources

- [yt-dlp Docs](https://github.com/yt-dlp/yt-dlp)
- [Render Docs](https://render.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Node.js Docs](https://nodejs.org)

---

## Summary

| Step | Action | Result |
|------|--------|--------|
| 1 | Local setup + npm install | Works on `localhost:3000` |
| 2 | Push to GitHub | Code backed up |
| 3 | Deploy backend on Render | Backend API live |
| 4 | Update frontend URL | Frontend talks to backend |
| 5 | Deploy frontend (Netlify or Render) | Entire app live |

**Result:** User searches and plays videos, all through your proxy server. Zero direct YouTube.com contact.

---

**For professor demo:** Show how all traffic flows through your server using browser DevTools Network tab.

🎓 College project complete!
