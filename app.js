const music = new Audio("./song.mp3");
const canvas = document.getElementById("text");
const button = document.getElementById("start");
const ctx = canvas.getContext("2d");
import song from "./song.json" assert { type: "json" };
const lyricEntries = Object.values(song.lyrics);
const lyricEntriesInversed = Object.values(song.lyrics).reverse();
// schema:
// {
// 	"bpm": 120,
// 	"lyrics": [ { time: "0:0:0", text: "hello", chars: number } ]
// time is in a Bar, Sixteenth, and Tick format, PPQ is 96
document.body.appendChild(music);
let startTime = 0;
let currentLyric = "";
let currentLyricChars = 0;
let currentLyricClipOffset = 0;
function start() {
    music.play();
    button.remove();
    startTime = performance.now();
    currentLyric = "";
}
button.addEventListener("click", start);
let lastFrame = performance.now();
function tickFromBST(bar, sixteenth, tick) {
    return bar * 96 * 4 + sixteenth * 24 + tick;
}
function extractTime(time) {
    let [bar, sixteenth, tick] = time.split(":").map(Number);
    bar = bar || 0;
    if (bar > 0)
        bar -= 1;
    sixteenth = sixteenth || 0;
    if (sixteenth > 0)
        sixteenth -= 1;
    tick = tick || 0;
    return tickFromBST(bar, sixteenth, tick);
}
function floorAndPad(num) {
    if (num < 10)
        return `0${Math.floor(num)}`;
    return Math.floor(num);
}
let activeEntry = undefined;
function render() {
    const delta = performance.now() - lastFrame;
    lastFrame = performance.now();
    const time = (performance.now() - startTime) / 1e3;
    const beat = time * (song.bpm / 60);
    const totalTicks = beat * 96;
    const bar = Math.floor(totalTicks / (96 * 4));
    const sixteenth = Math.floor((totalTicks % (96 * 4)) / 24);
    const tick = Math.floor((totalTicks % (96 * 4)) % 24);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1f1f1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "32px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Time: ${time.toFixed(2)}`, 8, 8);
    ctx.fillText(`${floorAndPad(bar + 1)}:${floorAndPad(sixteenth + 1)}:${floorAndPad(tick)} - ${Math.floor(totalTicks)}`, 8, 40);
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#bfbfbf";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(song.title, canvas.width / 2, canvas.height / 2);
    ctx.font = "16px Arial";
    ctx.textBaseline = "top";
    ctx.fillText(song.artist, canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "#000000";
    const currentEntry = lyricEntriesInversed.find((entry) => extractTime(entry.time) <= totalTicks);
    const nextEntry = lyricEntries.find((entry) => extractTime(entry.time) > totalTicks);
    let currentLyricLetters = currentLyric.slice(0, currentLyricChars);
    if (currentLyricChars === 0)
        currentLyricLetters = "";
    const textMetrics = ctx.measureText(currentLyric);
    const textMetrics2 = ctx.measureText(currentLyricLetters);
    if (currentEntry) {
        currentLyric = currentEntry.text || currentLyric;
        currentLyricChars =
            currentEntry.chars !== undefined
                ? currentEntry.chars
                : currentLyricChars;
        if (currentLyricChars === -1)
            currentLyricChars = currentLyric.length;
        if (currentEntry.chars) {
            if (activeEntry !== currentEntry) {
                currentLyricClipOffset = textMetrics2.width;
            }
        }
        if (currentEntry.text) {
            currentLyricClipOffset = 0;
        }
    }
    ctx.strokeText(currentLyric, canvas.width / 2 - textMetrics.width / 2, canvas.height - 56);
    ctx.fillText(currentLyric, canvas.width / 2 - textMetrics.width / 2, canvas.height - 56);
    ctx.fillStyle = "#00aaff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    // if there is a duration for the current lyric, use that
    // to animate the text
    ctx.save();
    if (currentEntry && currentEntry.duration) {
        const duration = extractTime(currentEntry.duration);
        const currentDuration = totalTicks - extractTime(currentEntry.time);
        const durationPercent = Math.min(currentDuration / duration, 1);
        const width = currentLyricClipOffset +
            (textMetrics2.width - currentLyricClipOffset) * durationPercent;
        ctx.beginPath();
        ctx.rect(canvas.width / 2 - textMetrics.width / 2, canvas.height - 56, width, 48);
        ctx.clip();
    }
    ctx.strokeText(currentLyricLetters, canvas.width / 2 - textMetrics.width / 2, canvas.height - 56);
    ctx.fillText(currentLyricLetters, canvas.width / 2 - textMetrics.width / 2, canvas.height - 56);
    ctx.restore();
    if (currentEntry) {
        activeEntry = currentEntry;
    }
    requestAnimationFrame(render);
}
render();
//# sourceMappingURL=app.js.map