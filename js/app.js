import { initViewer } from './viewer.js';
import { ScreenTexture } from './screen-texture.js';
import { ExportViewport } from './export-viewport.js';

const mv = document.getElementById('mv');
const chooseBtn = document.getElementById('chooseImage');
const fileInput = document.getElementById('imageInput');
const clearBtn = document.getElementById('clear');
const exportBtn = document.getElementById('export');
const copyBtn = document.getElementById('copy');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const msg = document.getElementById('msg');

const state = { flipH: false, flipV: false, lastFile: null };

const screen = new ScreenTexture(mv);
const exporter = new ExportViewport(mv);

function setMsg(text) { if (msg) msg.textContent = text; }

async function handleFile(file) {
  state.lastFile = file;
  try {
    await screen.applyImageFile(file, { flipH: state.flipH, flipV: state.flipV });
    setMsg('✅ Screenshot applied');
  } catch (e) {
    console.error(e);
    setMsg(e?.message || 'Failed to apply image.');
  }
}

async function handleClear() {
  await screen.clear();
  state.lastFile = null;
  setMsg('Cleared.');
}

async function handleExport() {
  try {
    const blob = await exporter.exportPng720();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mockup-720.png'; a.click();
    URL.revokeObjectURL(url);
    setMsg('✅ Exported.');
  } catch (e) {
    console.error(e);
    setMsg('Export failed.');
  }
}

async function handleCopy() {
  try {
    const blob = await exporter.exportPng720();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    setMsg('📋 Copied to clipboard.');
  } catch (e) {
    console.error(e);
    setMsg('Clipboard copy failed.');
  }
}

function bindUI() {
  chooseBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (f) await handleFile(f);
  });
  clearBtn?.addEventListener('click', () => handleClear());
  exportBtn?.addEventListener('click', () => handleExport());
  copyBtn?.addEventListener('click', () => handleCopy());
  flipHBtn?.addEventListener('click', async () => {
    state.flipH = !state.flipH;
    if (state.lastFile) await handleFile(state.lastFile);
  });
  flipVBtn?.addEventListener('click', async () => {
    state.flipV = !state.flipV;
    if (state.lastFile) await handleFile(state.lastFile);
  });
}

async function main() {
  await initViewer(mv);
  bindUI();
}

main().catch(console.error);