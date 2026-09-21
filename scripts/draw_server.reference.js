const http = require('http');
const PORT = 8080;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>ONTOS — DRAW</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --void: #07070d;
  --panel: rgba(14,14,26,0.92);
  --border: rgba(255,255,255,0.07);
  --text: #8892a4;
  --bright: #dde3f0;
  --cyan: #00d4ff;
}

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  background: var(--void);
  font-family: 'JetBrains Mono', monospace;
  touch-action: none;
  user-select: none;
}

/* ── CANVAS ── */
#drawCanvas {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  cursor: crosshair;
  touch-action: none;
}

/* ── GRID OVERLAY ── */
#gridCanvas {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* ── HEADER ── */
#header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(7,7,13,0.97) 0%, transparent 100%);
}
#logo { font-size: 10px; font-weight: 700; letter-spacing: 0.3em; color: var(--bright); }
#logo em { color: var(--cyan); font-style: normal; }
#playback-status {
  font-size: 9px; letter-spacing: 0.15em; color: var(--text);
  display: flex; align-items: center; gap: 6px;
}
#pb-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text); transition: background 0.2s, box-shadow 0.2s;
}
#pb-dot.playing { background: #00e5a0; box-shadow: 0 0 8px #00e5a0; }
#pb-dot.drawing { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }

/* ── INSTRUMENT PALETTE ── */
#palette {
  position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
  z-index: 10;
  display: flex; gap: 10px; align-items: center;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 50px;
  padding: 8px 14px;
  backdrop-filter: blur(12px);
}
.inst-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s, border-color 0.15s;
  flex-shrink: 0;
}
.inst-btn.selected {
  border-color: #fff;
  transform: scale(1.15);
  box-shadow: 0 0 12px currentColor;
}
.inst-btn::after {
  content: attr(data-label);
  position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%);
  font-size: 7px; letter-spacing: 0.08em;
  color: var(--text); white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}
.inst-btn.selected::after { opacity: 1; }

/* ── BOTTOM CONTROLS ── */
#controls {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 18px 16px;
  background: linear-gradient(0deg, rgba(7,7,13,0.97) 0%, transparent 100%);
}
.ctrl-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--bright);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.12em;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.ctrl-btn:active { background: rgba(255,255,255,0.12); }
.ctrl-btn.danger { border-color: rgba(255,45,85,0.3); color: #ff2d55; }
.ctrl-btn.primary { border-color: rgba(0,212,255,0.3); color: var(--cyan); }

#stroke-info {
  font-size: 9px; color: var(--text); letter-spacing: 0.1em;
  text-align: center; line-height: 1.6;
}
#stroke-count { color: var(--bright); font-weight: 600; }

/* ── PLAYBACK CURSOR ── */
#playhead {
  position: fixed; top: 0; bottom: 0;
  width: 1px;
  background: rgba(0,212,255,0.6);
  box-shadow: 0 0 8px var(--cyan);
  pointer-events: none;
  z-index: 5;
  display: none;
  left: 0;
  transition: left 0.016s linear;
}

/* ── FREQ RULER ── */
#ruler {
  position: fixed; left: 0; top: 44px; bottom: 64px;
  width: 28px; z-index: 9;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 4px 0;
  pointer-events: none;
}
.ruler-lbl {
  font-size: 7px; color: var(--text); text-align: right;
  padding-right: 4px; letter-spacing: 0.05em;
}

/* ── NOTE FLASH ── */
#note-flash {
  position: fixed; inset: 0; z-index: 4;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.05s;
}
</style>
</head>
<body>

<canvas id="gridCanvas"></canvas>
<canvas id="drawCanvas"></canvas>
<div id="playhead"></div>
<div id="note-flash"></div>

<div id="header">
  <div id="logo">ON<em>T</em>OS <span style="opacity:.3;font-size:9px">DRAW</span></div>
  <div id="playback-status">
    <div id="pb-dot"></div>
    <span id="pb-txt">READY</span>
  </div>
</div>

<div id="ruler">
  <div class="ruler-lbl">HI</div>
  <div class="ruler-lbl">—</div>
  <div class="ruler-lbl">MID</div>
  <div class="ruler-lbl">—</div>
  <div class="ruler-lbl">LO</div>
</div>

<div id="palette"></div>

<div id="controls">
  <button class="ctrl-btn danger" onclick="clearAll()">CLR</button>
  <div id="stroke-info">
    <span id="stroke-count">0</span> TRAZOS<br>
    <span id="note-count">0</span> NOTAS
  </div>
  <button class="ctrl-btn primary" onclick="playAll()">▶ PLAY</button>
</div>

<script>
// ═══════════════════════════════════════════
// INSTRUMENTS
// ═══════════════════════════════════════════
const INSTRUMENTS = [
  { id: 0, name: 'SINE',  color: '#00d4ff', hex: 0x00d4ff, type: 'sine',     label: 'SINE'  },
  { id: 1, name: 'SAW',   color: '#ff2d55', hex: 0xff2d55, type: 'sawtooth', label: 'SAW'   },
  { id: 2, name: 'SQR',   color: '#ffd60a', hex: 0xffd60a, type: 'square',   label: 'SQUARE'},
  { id: 3, name: 'TRI',   color: '#00e5a0', hex: 0x00e5a0, type: 'triangle', label: 'TRI'   },
  { id: 4, name: 'NOISE', color: '#bf5af2', hex: 0xbf5af2, type: 'noise',    label: 'NOISE' },
  { id: 5, name: 'FM',    color: '#ff6b2b', hex: 0xff6b2b, type: 'fm',       label: 'FM'    },
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let audioCtx = null;
let selectedInst = 0;
let strokes = [];        // [{inst, points:[{x,y}], color}]
let currentStroke = null;
let isDrawing = false;
let isPlaying = false;
let playTimeout = null;

// ═══════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════
const drawCanvas = document.getElementById('drawCanvas');
const dc = drawCanvas.getContext('2d');
const gridCanvas = document.getElementById('gridCanvas');
const gc = gridCanvas.getContext('2d');

function resize() {
  drawCanvas.width  = window.innerWidth;
  drawCanvas.height = window.innerHeight;
  gridCanvas.width  = window.innerWidth;
  gridCanvas.height = window.innerHeight;
  drawGrid();
  redrawAll();
}
window.addEventListener('resize', resize);

// ── GRID ──
function drawGrid() {
  const W = gridCanvas.width, H = gridCanvas.height;
  gc.clearRect(0, 0, W, H);

  // Frequency horizontal lines (note zones)
  const freqLines = [0.1, 0.25, 0.5, 0.75, 0.9];
  gc.strokeStyle = 'rgba(255,255,255,0.04)';
  gc.lineWidth = 1;
  freqLines.forEach(t => {
    const y = t * H;
    gc.beginPath(); gc.moveTo(0, y); gc.lineTo(W, y); gc.stroke();
  });

  // Vertical time guides
  for (let i = 1; i < 8; i++) {
    gc.beginPath();
    gc.moveTo(i * W / 8, 0);
    gc.lineTo(i * W / 8, H);
    gc.stroke();
  }

  // Center freq line (mid note) — slightly brighter
  gc.strokeStyle = 'rgba(255,255,255,0.09)';
  gc.lineWidth = 1;
  gc.setLineDash([4, 8]);
  gc.beginPath(); gc.moveTo(0, H * 0.5); gc.lineTo(W, H * 0.5); gc.stroke();
  gc.setLineDash([]);
}

// ═══════════════════════════════════════════
// PALETTE UI
// ═══════════════════════════════════════════
const palette = document.getElementById('palette');
INSTRUMENTS.forEach((inst, i) => {
  const btn = document.createElement('button');
  btn.className = 'inst-btn' + (i === 0 ? ' selected' : '');
  btn.style.background = inst.color;
  btn.style.color = inst.color;
  btn.setAttribute('data-label', inst.label);
  btn.setAttribute('title', inst.label);
  btn.onclick = () => {
    document.querySelectorAll('.inst-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedInst = i;
  };
  palette.appendChild(btn);
});

// ═══════════════════════════════════════════
// DRAW INPUT
// ═══════════════════════════════════════════
function getPos(e) {
  const r = drawCanvas.getBoundingClientRect();
  if (e.touches) {
    return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
  }
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function startDraw(e) {
  if (isPlaying) return;
  e.preventDefault();
  initAudio();
  isDrawing = true;
  const pos = getPos(e);
  const inst = INSTRUMENTS[selectedInst];
  currentStroke = { inst: selectedInst, color: inst.color, points: [pos] };

  setPbState('drawing', 'DRAWING');

  dc.beginPath();
  dc.moveTo(pos.x, pos.y);
}

function moveDraw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  const prev = currentStroke.points[currentStroke.points.length - 1];
  currentStroke.points.push(pos);

  // Draw live stroke
  dc.lineTo(pos.x, pos.y);
  dc.strokeStyle = currentStroke.color;
  dc.lineWidth = 2.5;
  dc.lineCap = 'round';
  dc.lineJoin = 'round';
  dc.shadowColor = currentStroke.color;
  dc.shadowBlur = 8;
  dc.stroke();
  dc.beginPath();
  dc.moveTo(pos.x, pos.y);
}

function endDraw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  isDrawing = false;
  dc.shadowBlur = 0;

  if (currentStroke && currentStroke.points.length > 1) {
    // Simplify: sample evenly up to 80 points
    const pts = currentStroke.points;
    const maxNotes = 80;
    const step = Math.max(1, Math.floor(pts.length / maxNotes));
    const sampled = [];
    for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
    currentStroke.points = sampled;

    strokes.push(currentStroke);
    updateInfo();
    playStroke(currentStroke);
  }
  currentStroke = null;
  setPbState('ready', 'READY');
}

drawCanvas.addEventListener('mousedown',  startDraw);
drawCanvas.addEventListener('mousemove',  moveDraw);
drawCanvas.addEventListener('mouseup',    endDraw);
drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
drawCanvas.addEventListener('touchmove',  moveDraw,  { passive: false });
drawCanvas.addEventListener('touchend',   endDraw,   { passive: false });

// ═══════════════════════════════════════════
// REDRAW
// ═══════════════════════════════════════════
function redrawAll() {
  dc.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  strokes.forEach(s => drawStroke(s));
}

function drawStroke(s) {
  if (s.points.length < 2) return;
  dc.beginPath();
  dc.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    dc.lineTo(s.points[i].x, s.points[i].y);
  }
  dc.strokeStyle = s.color;
  dc.lineWidth = 2.5;
  dc.lineCap = 'round';
  dc.lineJoin = 'round';
  dc.shadowColor = s.color;
  dc.shadowBlur = 10;
  dc.stroke();
  dc.shadowBlur = 0;

  // Dot at each note point
  dc.fillStyle = s.color;
  s.points.forEach((p, i) => {
    if (i % 4 === 0) {
      dc.beginPath();
      dc.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      dc.fill();
    }
  });
}

// ═══════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Map y (0=top=high, H=bottom=low) to frequency
function yToFreq(y) {
  const H = drawCanvas.height;
  const t = 1 - (y / H); // 0=low, 1=high
  // Log scale: 80Hz to 2400Hz
  const minF = 80, maxF = 2400;
  return minF * Math.pow(maxF / minF, t);
}

// Map y to gain (top=louder)
function yToGain(y) {
  const H = drawCanvas.height;
  const t = 1 - (y / H);
  return 0.15 + t * 0.55;
}

function noiseBuffer() {
  const sz = audioCtx.sampleRate * 0.15;
  const buf = audioCtx.createBuffer(1, sz, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function playNote(instId, freq, gain, startTime, duration) {
  const inst = INSTRUMENTS[instId];
  const g = audioCtx.createGain();
  const comp = audioCtx.createDynamicsCompressor();
  g.connect(comp); comp.connect(audioCtx.destination);

  const t = startTime;
  const dur = Math.max(0.04, duration);

  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.setValueAtTime(gain, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  if (inst.type === 'noise') {
    const n = audioCtx.createBufferSource();
    n.buffer = noiseBuffer();
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq, t);
    bp.Q.value = 3;
    n.connect(bp); bp.connect(g);
    n.start(t); n.stop(t + dur + 0.01);
  } else if (inst.type === 'fm') {
    // FM: carrier + modulator
    const carrier = audioCtx.createOscillator();
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    carrier.type = 'sine';
    modulator.type = 'sine';
    carrier.frequency.setValueAtTime(freq, t);
    modulator.frequency.setValueAtTime(freq * 2.5, t);
    modGain.gain.setValueAtTime(freq * 1.5, t);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(g);
    carrier.start(t); carrier.stop(t + dur + 0.01);
    modulator.start(t); modulator.stop(t + dur + 0.01);
  } else {
    const osc = audioCtx.createOscillator();
    osc.type = inst.type;
    osc.frequency.setValueAtTime(freq, t);
    // Slight pitch drift for expressiveness
    osc.frequency.linearRampToValueAtTime(freq * 0.98, t + dur);
    osc.connect(g);
    osc.start(t); osc.stop(t + dur + 0.01);
  }
}

// ═══════════════════════════════════════════
// STROKE PLAYBACK
// ═══════════════════════════════════════════
function playStroke(s) {
  if (!audioCtx || s.points.length < 2) return;
  const now = audioCtx.currentTime + 0.05;
  const W = drawCanvas.width;

  // Sort points left-to-right for X=time mapping
  const sorted = [...s.points].sort((a, b) => a.x - b.x);

  // Duration: spread over 1.2s max, min 0.04s per note
  const totalDur = Math.min(1.8, Math.max(0.4, sorted.length * 0.025));
  const noteDur = totalDur / sorted.length;

  sorted.forEach((p, i) => {
    const tOffset = (i / sorted.length) * totalDur;
    const freq = yToFreq(p.y);
    const gain = yToGain(p.y);
    playNote(s.inst, freq, gain, now + tOffset, noteDur * 1.6);
  });
}

// ── PLAY ALL strokes simultaneously (sorted by X origin) ──
function playAll() {
  if (strokes.length === 0) return;
  if (isPlaying) return;
  initAudio();
  isPlaying = true;
  setPbState('playing', 'PLAYING');

  const W = drawCanvas.width;
  const playhead = document.getElementById('playhead');
  playhead.style.display = 'block';

  const totalDur = 2.5; // total playback window in seconds
  const startTime = audioCtx.currentTime + 0.05;

  strokes.forEach(s => {
    if (s.points.length < 1) return;
    const sorted = [...s.points].sort((a, b) => a.x - b.x);
    const noteDur = 0.12;

    sorted.forEach(p => {
      // X maps to time: 0..W → 0..totalDur
      const tOffset = (p.x / W) * totalDur;
      const freq = yToFreq(p.y);
      const gain = yToGain(p.y);
      playNote(s.inst, freq, gain, startTime + tOffset, noteDur);
    });
  });

  // Animate playhead
  const startMs = performance.now();
  const totalMs = totalDur * 1000;
  function animPlayhead() {
    const elapsed = performance.now() - startMs;
    const t = Math.min(1, elapsed / totalMs);
    playhead.style.left = (t * W) + 'px';
    if (t < 1) requestAnimationFrame(animPlayhead);
    else {
      playhead.style.display = 'none';
      isPlaying = false;
      setPbState('ready', 'READY');
    }
  }
  requestAnimationFrame(animPlayhead);
}

// ═══════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════
function clearAll() {
  strokes = [];
  dc.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  updateInfo();
  setPbState('ready', 'READY');
}

function updateInfo() {
  document.getElementById('stroke-count').textContent = strokes.length;
  const total = strokes.reduce((acc, s) => acc + s.points.length, 0);
  document.getElementById('note-count').textContent = total;
}

function setPbState(state, txt) {
  const dot = document.getElementById('pb-dot');
  dot.className = state === 'playing' ? 'playing' : state === 'drawing' ? 'drawing' : '';
  document.getElementById('pb-txt').textContent = txt;
}

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════
resize();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[97m  ONTOS  \x1b[36mDRAW ENGINE\x1b[0m');
  console.log('\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[36m  http://localhost:' + PORT + '\x1b[0m');
  console.log('\x1b[90m  6 instrumentos · X=tiempo · Y=frecuencia\x1b[0m');
  console.log('\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
});
