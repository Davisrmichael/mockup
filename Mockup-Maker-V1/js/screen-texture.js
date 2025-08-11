import * as THREE from 'https://esm.sh/three@0.160.0';

export function makeScreenTextureManager(getMaterial) {
  let lastTex = null;
  let lastEmissive = null;

  async function fileToBitmap(file) {
    const blob = file instanceof Blob ? file : new Blob([file]);
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  }

  function makeTextureFromBitmap(bmp) {
    const tex = new THREE.Texture(bmp);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // GLTF convention
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  async function applyFileToMaterial(file, { bright = true } = {}) {
    const mat = getMaterial();
    if (!mat) throw new Error('Screen material not found in model.');

    // dispose old
    if (lastTex) lastTex.dispose();
    if (lastEmissive) lastEmissive.dispose();

    const bmp = await fileToBitmap(file);
    const tex = makeTextureFromBitmap(bmp);

    mat.map = tex;
    mat.needsUpdate = true;

    if (bright) {
      const emis = makeTextureFromBitmap(bmp);
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = emis;
      lastEmissive = emis;
    } else {
      mat.emissiveMap = null;
      mat.emissive.set(0x000000);
    }

    lastTex = tex;
  }

  function clear() {
    const mat = getMaterial();
    if (!mat) return;
    if (lastTex) { lastTex.dispose(); lastTex = null; }
    if (lastEmissive) { lastEmissive.dispose(); lastEmissive = null; }
    mat.map = null;
    mat.emissiveMap = null;
    mat.emissive = new THREE.Color(0x000000);
    mat.needsUpdate = true;
  }

  return { applyFileToMaterial, clear };
}
