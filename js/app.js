
// v1 app bootstrap
import { createViewer } from './viewer.js';
import { makeScreenTextureManager } from './screen-texture.js';
import { makeExporter } from './export-viewport.js';

const mv = document.getElementById('mv');
const chooseBtn = document.getElementById('chooseImage');
const fileInput = document.getElementById('imageInput');
const clearBtn = document.getElementById('clear');
const exportBtn = document.getElementById('export');
const copyBtn = document.getElementById('copy');
const msg = document.getElementById('msg');

let viewer;
let screen;

(async () => {
  try {
    viewer = await createViewer(mv, { startYawDeg: 180 });
    screen = makeScreenTextureManager(() => viewer.findMaterialByName('Screen'));
  } catch (e) {
    msg.textContent = `Failed to load model: ${e.message || e}`;
    console.error(e);
    throw e;
  }

  // Wire UI
  chooseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    if (!f) return;
    try {
      await screen.applyFileToMaterial(f, { bright: true, cover: true, fixFlip: true, fixMirror: true });
      msg.textContent = '✅ Screenshot applied';
    } catch (e) {
      console.error(e);
      msg.textContent = e?.message || 'Failed to apply image. Try another file / refresh.';
    }
  });

  clearBtn.addEventListener('click', () => {
    try {
      screen.clear();
      msg.textContent = 'Cleared.';
    } catch (e) {
      console.error(e);
      msg.textContent = 'Could not clear.';
    }
  });

  const exporter = makeExporter(mv);
  exportBtn.addEventListener('click', async () => {
    try {
      const url = await exporter.exportViewerPNG();
      const a = document.createElement('a');
      a.download = 'mockup-720.png';
      a.href = url;
      a.click();
      msg.textContent = '✅ Exported.';
    } catch (e) {
      console.error(e);
      msg.textContent = 'Export failed.';
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      const url = await exporter.exportViewerPNG();
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      msg.textContent = '📋 Copied to clipboard.';
    } catch (e) {
      console.error(e);
      msg.textContent = 'Clipboard copy failed (browser permissions?).';
    }
  });
})();
