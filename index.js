const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const multiparty = require("multiparty");
const request = require("request");

const app = express();
app.use(cors());

app.get("/api/download-audio", (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send("Missing videoId");

  const output = `audio-${videoId}.mp3`;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const cmd = `./yt-dlp -x --audio-format mp3 -o ${output} "${url}"`;

  console.log("▶️ Running yt-dlp command:", cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ yt-dlp error:", err);
      console.error("stderr:", stderr);
      return res.status(500).send("Download error: " + stderr);
    }

    console.log("✅ Download complete. Sending file...");

    const fileStream = fs.createReadStream(output);
    res.setHeader("Content-Type", "audio/mpeg");
    fileStream.pipe(res);

    fileStream.on("end", () => {
      console.log("🧹 Cleaning up:", output);
      fs.unlink(output, () => {});
    });
  });
});

// ✅ NEW Whisper transcription route
app.post("/api/transcribe", (req, res) => {
  const form = new multiparty.Form();

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("❌ Form parse error:", err);
      return res.status(500).send("Upload parse error");
    }

    const filePath = files.file[0].path;

    const whisperReq = request.post({
      url: "https://huggingface.co/spaces/openai/whisper/file",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
      },
    }, (err, response, body) => {
      if (err) {
        console.error("❌ Whisper request failed:", err);
        return res.status(500).send("Whisper request failed");
      }

      res.setHeader("Content-Type", "application/json");
      res.send(body);
    });

    const whisperForm = whisperReq.form();
    whisperForm.append("file", fs.createReadStream(filePath));
  });
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
