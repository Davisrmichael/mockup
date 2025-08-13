
// screen-texture.js — applies a user image to the 'Screen' material
// Draw into an offscreen canvas to: cover, keep aspect, and unflip/unmirror if needed.
export function makeScreenTextureManager(getScreenMaterial){
  const WORK_W = 2048;
  const WORK_H = 4096; // tall phone aspect

  const canvas = document.createElement('canvas');
  canvas.width = WORK_W;
  canvas.height = WORK_H;
  const ctx = canvas.getContext('2d');

  function drawCover(img, { fixFlip = true, fixMirror = true } = {}){
    // Clear
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Optional unflip/unmirror
    let sx = 1, sy = 1, tx = 0, ty = 0;
    if(fixMirror){ sx *= -1; tx = canvas.width; } // undo horizontal mirroring
    if(fixFlip){ sy *= -1; ty = canvas.height; }  // undo vertical flip
    ctx.setTransform(sx, 0, 0, sy, tx, ty);

    // Compute cover scale
    const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    const dx = (canvas.width - dw) * 0.5;
    const dy = (canvas.height - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);

    // Reset transform for future operations
    ctx.setTransform(1,0,0,1,0,0);
  }

  async function applyFileToMaterial(file, opts = {}){
    const mat = getScreenMaterial();
    if(!mat) throw new Error('Screen material not found.');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const url = URL.createObjectURL(file);
    await new Promise((resolve, reject)=>{
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    drawCover(img, opts);

    // Create model-viewer texture from canvas
    const mv = document.querySelector('model-viewer');
    const tex = await mv.createTexture(canvas);
    // Apply to baseColor and emissive for brightness
    mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
    mat.pbrMetallicRoughness.setBaseColorTexture(tex);
    mat.setEmissiveTexture(tex);
    mat.setEmissiveFactor([1,1,1]);
  }

  function clear(){
    const mat = getScreenMaterial();
    if(!mat) return;
    mat.pbrMetallicRoughness.baseColorTexture?.setTexture(null);
    mat.setEmissiveTexture(null);
    mat.setEmissiveFactor([0,0,0]);
  }

  return { applyFileToMaterial, clear };
}
