# YouTube Proxy Player - Quick Start (5 Minutes)

## Step 1: Install Prerequisites (2 min)

### Windows:
1. **Install Node.js 18+:**
   - Download from https://nodejs.org
   - Run installer, click Next repeatedly
   - Verify: Open CMD, type `node --version` (should show v18+)

2. **Install yt-dlp:**
   - Download `yt-dlp.exe` from https://github.com/yt-dlp/yt-dlp/releases
   - Save to `C:\yt-dlp.exe`
   - Open CMD, verify: `C:\yt-dlp.exe --version` (should show 2025.xx.xx)

### macOS:
```bash
brew install node
brew install yt-dlp
```

### Linux:
```bash
sudo apt update
sudo apt install nodejs npm yt-dlp
```

---

## Step 2: Setup Project (1 min)

1. **Create folder in VS Code:**
   ```bash
   mkdir youtube-proxy-player
   cd youtube-proxy-player
   ```

2. **Copy these 4 files into the folder:**
   - `server.js`
   - `package.json`
   - `public/index.html` (create `public` folder first)
   - `README.md`

3. **Install dependencies:**
   ```bash
   npm install
   ```

---

## Step 3: Run Locally (1 min)

```bash
npm start
```

You should see:
```
🚀 YouTube Proxy Server running on http://localhost:3000
```

**Open browser:** `http://localhost:3000`

**Test it:**
- Search: "javascript tutorial"
- Click a video
- It should play!

✅ If this works, you're ready to deploy!

---

## Step 4: Deploy Backend to Render (5 min)

### Push to GitHub:
```bash
git init
git add .
git commit -m "YouTube proxy player"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youtube-proxy-player.git
git push -u origin main
```

### Deploy on Render:
1. Go to https://render.com → **Sign up** (free with GitHub)
2. Click **"New +"** → **"Web Service"**
3. Select your `youtube-proxy-player` repo
4. **Name:** `youtube-proxy-player`
5. **Environment:** Node
6. **Build Command:**
   ```
   npm install && apt-get update && apt-get install -y yt-dlp ffmpeg
   ```
7. **Start Command:** `node server.js`
8. Click **"Create Web Service"**

⏳ Wait 3-5 minutes...

Your backend URL appears:
```
https://youtube-proxy-player.onrender.com
```

---

## Step 5: Deploy Frontend (1 min)

### Option A: Keep on Render (Already Deployed!)
Your frontend is already live at the same URL. Done!

### Option B: Deploy to Netlify (Faster)
1. Go to https://netlify.com → Sign up (free)
2. Create a new file: `.netlify/functions/rewrite.js` with:
   ```javascript
   module.exports = {
     redirects: [
       {
         from: '/api/*',
         to: 'https://youtube-proxy-player.onrender.com/api/:splat',
         status: 200,
         force: true
       }
     ]
   };
   ```
3. Drag & drop `public/index.html` to Netlify
4. Set environment variable: `REACT_APP_API_BASE=https://youtube-proxy-player.onrender.com`

Your frontend URL:
```
https://xyz123.netlify.app
```

---

## ✅ Done! You have:

- ✓ Backend: `https://youtube-proxy-player.onrender.com` (Render)
- ✓ Frontend: `https://xyz123.netlify.app` or same as backend (Netlify or Render)
- ✓ All requests go through your server
- ✓ No direct YouTube.com access from user

---

## Testing Deployment

1. Open frontend URL in browser
2. Search: "how to code"
3. Click video
4. **Check browser DevTools (F12) → Network tab:**
   - You should see requests to **your server domain** only
   - **Never** to youtube.com
5. Video plays through your proxy ✓

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "yt-dlp not found" | Make sure it's installed: `yt-dlp --version` |
| Search doesn't work | Backend may be sleeping (Render free). Refresh page, wait 30 sec. |
| Video won't play | Check frontend URL matches backend. Network tab should show `api/stream` requests. |
| "Cannot find module" | Run `npm install` again |

---

## For Professor Demo

1. **Show the site:** Open frontend URL
2. **Search & play:** Search video, click to play
3. **Show Network tab (F12):**
   - All requests to YOUR server
   - Explain: "Search goes to my server → my server talks to YouTube → results come back"
   - "When clicking video: request goes to my server → downloads from YouTube → streams back"
4. **Show server logs:** Terminal shows `🔍 Searching...`, `⬇️ Downloading...`, `✓ Streaming...`

**Key point:** User network blocks YouTube.com, but YOUR server can access it, so it acts as a proxy!

---

## Important Notes

- 🔐 **Keep URL private** - This is for college demo only, not public use
- ⏱️ **Videos auto-delete** after 1 hour
- 💤 **Render free tier** spins down after 15 min of no use (wakes on first request)
- 📊 **Check storage** if videos accumulate

---

## Next Steps (Optional)

- Add authentication (only you can use it)
- Add video download button
- Cache search results in database
- Upgrade Render to paid tier for always-on

Good luck! 🚀
