const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/stream", (req, res) => {
    let manifest = req.query.manifest;
    if (!manifest) return res.status(400).send("Missing ?manifest parameter");
    if (!/^https?:\/\//i.test(manifest)) manifest = path.resolve(__dirname, manifest);
  
    res.setHeader("Content-Type", "video/mp4");
  
    const ffmpegArgs = [
        "-protocol_whitelist", "file,http,https,tcp,tls",
        "-i", manifest,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        "-f", "mp4",
        "-movflags", "frag_keyframe+empty_moov",
        "pipe:1"
    ];
  
    const ffmpeg = spawn("ffmpeg", ffmpegArgs);
  
    ffmpeg.stdout.pipe(res);
    ffmpeg.stderr.on("data", d => console.error("[ffmpeg]", d.toString()));
    ffmpeg.on("close", code => {
        console.log(`ffmpeg exited with code ${code}`);
        res.end();
    });
});
  

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
