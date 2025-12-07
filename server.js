const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const VIDEOS_DIR = path.join(__dirname, 'videos');
const VIDEO_LIFETIME = 60 * 60 * 1000;
const downloadCache = new Map();

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

function scheduleCleanup(videoId, filename) {
  setTimeout(() => {
    const filepath = path.join(VIDEOS_DIR, filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`✓ Deleted: ${filename}`);
      }
    } catch (err) {
      console.error(`Error deleting ${filename}:`, err.message);
    }
  }, VIDEO_LIFETIME);
}

function runYtDlp(args, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-m', 'yt_dlp', ...args]);
    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      finished = true;
      proc.kill();
      reject(new Error('yt-dlp timeout'));
    }, timeoutMs);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (!finished) {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!finished) {
        reject(err);
      }
    });
  });
}

app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query required' });
  }

  try {
    console.log(`🔍 Searching: "${query}"`);

    // KEY: Add --flat-playlist to reduce output size
    const output = await runYtDlp([
      `ytsearch20:${query}`,
      '--dump-json',
      '--no-warnings',
      '--flat-playlist',
      '-j'
    ], 30000);

    if (!output || output.length < 10) {
      console.log('❌ No output');
      return res.json({ results: [], query });
    }

    const lines = output.split('\n').filter(l => l.trim());
    console.log(`📊 Got ${lines.length} lines`);
    
    const results = [];

    for (const line of lines) {
      if (results.length >= 20) break;
      
      try {
        const obj = JSON.parse(line);
        
        // Handle both direct videos and playlist entries
        if (obj.id && obj.title) {
          results.push({
            videoId: obj.id,
            title: obj.title.substring(0, 70),
            thumbnail: obj.thumbnail || `https://i.ytimg.com/vi/${obj.id}/mqdefault.jpg`,
            duration: obj.duration || 0,
            uploader: (obj.uploader || 'Unknown').substring(0, 30),
            viewCount: obj.view_count || 0
          });
        } else if (obj.entries && Array.isArray(obj.entries)) {
          // Handle playlist wrapper
          for (const entry of obj.entries) {
            if (results.length >= 20) break;
            if (entry.id && entry.title) {
              results.push({
                videoId: entry.id,
                title: entry.title.substring(0, 70),
                thumbnail: entry.thumbnail || `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
                duration: entry.duration || 0,
                uploader: (entry.uploader || 'Unknown').substring(0, 30),
                viewCount: entry.view_count || 0
              });
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    console.log(`✅ Found ${results.length} results`);
    res.json({ results, query });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.json({ results: [], query, error: err.message });
  }
});
app.get('/api/video-info/:videoId', async (req, res) => {
  const { videoId } = req.params;
  res.json({
    videoId: videoId,
    title: 'Video',
    description: 'Loading...',
    duration: 0,
    uploader: 'Unknown',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    viewCount: 0
  });
});

app.get('/api/embed/:videoId', (req, res) => {
  const { videoId } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>*{margin:0;padding:0;overflow:hidden}html,body{height:100%}iframe{height:100%;width:100%;border:none}</style>
    </head>
    <body>
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>
    </body>
    </html>
  `);
});
app.get('/api/stream/:videoId', (req, res) => {
  const { videoId } = req.params;
  console.log(`🎥 Embed iframe: ${videoId}`);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>*{margin:0;padding:0;overflow:hidden}html,body{height:100%}iframe{height:100%;width:100%;border:none}</style>
    </head>
    <body>
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1" 
        frameborder="0" 
        allowfullscreen 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        loading="lazy"
      ></iframe>
    </body>
    </html>
  `);
});


function streamVideo(res, filepath) {
  const stats = fs.statSync(filepath);
  const fileSize = stats.size;
  const range = res.req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(filepath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filepath).pipe(res);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 YouTube Proxy Server running on http://localhost:${PORT}`);
  console.log('📺 Open http://localhost:3000 to start\n');
});
