
#!/bin/bash
apt-get update && apt-get install -y python3 ffmpeg && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp && chmod +x yt-dlp
