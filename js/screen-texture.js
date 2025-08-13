import { getScreenMaterial } from './viewer.js';

const WORK_W = 2048;
const WORK_H = 4096;

export class ScreenTexture {
  constructor(modelViewer) {
    this.modelViewer = modelViewer;
    this.flipH = false;
    this.flipV = false;
    this.canvas = document.createElement('canvas');
    this.canvas.width = WORK_W;
    this.canvas.height = WORK_H;
    this.ctx = this.canvas.getContext('2d');
  }

  async applyImageFile(file, { flipH = false, flipV = false } = {}) {
    this.flipH = !!flipH;
    this.flipV = !!flipV;
    const image = await this.#loadImageFromFile(file);
    this.#drawCover(image, this.flipH, this.flipV);
    await this.#applyCanvasAsTexture();
  }

  async clear() {
    const mat = getScreenMaterial(this.modelViewer);
    if (!mat) return;
    mat.pbrMetallicRoughness.baseColorTexture?.setTexture(null);
    mat.setEmissiveTexture?.(null);
    mat.setEmissiveFactor?.([0, 0, 0]);
  }

  async #applyCanvasAsTexture() {
    const mat = getScreenMaterial(this.modelViewer);
    if (!mat) throw new Error('Screen material not found');
    const tex = await this.modelViewer.createTexture(this.canvas);
    if (mat.pbrMetallicRoughness.setBaseColorTexture) {
      mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
      mat.pbrMetallicRoughness.setBaseColorTexture(tex);
    } else if (mat.pbrMetallicRoughness.baseColorTexture?.setTexture) {
      mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
      mat.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
    }
    if (mat.setEmissiveTexture) {
      mat.setEmissiveTexture(tex);
      mat.setEmissiveFactor([1, 1, 1]);
    }
  }

  #drawCover(img, flipH, flipV) {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, WORK_W, WORK_H);
    let sx = 1, sy = 1, tx = 0, ty = 0;
    if (flipH) { sx = -1; tx = WORK_W; }
    if (flipV) { sy = -1; ty = WORK_H; }
    ctx.setTransform(sx, 0, 0, sy, tx, ty);
    const scale = Math.max(WORK_W / img.naturalWidth, WORK_H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (WORK_W - dw) / 2;
    const dy = (WORK_H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  async #loadImageFromFile(file) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url = URL.createObjectURL(file);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  }
}