import { getScreenMaterial } from './viewer.js';

// Use ~19.5:9 aspect to match iPhone display (reduces vertical stretch)
const WORK_W = 1179;
const WORK_H = 2556;

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
    try {
      this.flipH = !!flipH;
      this.flipV = !!flipV;
      
      console.log('Loading image from file:', file.name, file.type);
      const image = await this.#loadImageFromFile(file);
      console.log('Image loaded successfully:', image.naturalWidth, 'x', image.naturalHeight);
      
      console.log('Drawing image to canvas');
      this.#drawCover(image, this.flipH, this.flipV);
      console.log('Canvas prepared, applying texture');
      
      await this.#applyCanvasAsTexture();
      console.log('Texture applied successfully');
    } catch (error) {
      console.error('Error in applyImageFile:', error);
      throw error;
    }
  }

  async clear() {
    const mat = getScreenMaterial(this.modelViewer);
    if (!mat) return;
    mat.pbrMetallicRoughness.baseColorTexture?.setTexture(null);
    mat.setEmissiveTexture?.(null);
    mat.setEmissiveFactor?.([0, 0, 0]);
  }

  #ensureCleanCanvas() {
    // Reset canvas context to a clean state
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 10;
    ctx.restore();
  }

  async #applyCanvasAsTexture() {
    const mat = getScreenMaterial(this.modelViewer);
    if (!mat) throw new Error('Screen material not found');
    
    try {
      // Ensure the model-viewer is fully loaded
      if (this.modelViewer.model === null) {
        throw new Error('Model not yet loaded');
      }
      
      // Wait for the model to be fully ready
      await this.modelViewer.updateComplete;
      
      // Additional validation for model-viewer state
      if (!this.modelViewer.model || !this.modelViewer.model.materials) {
        throw new Error('Model materials not available');
      }
      
      console.log('Model materials:', this.modelViewer.model.materials.length);
      console.log('Screen material:', mat);
      
      // Debug what's available on model-viewer
      console.log('Model-viewer properties:', {
        hasCreateTexture: typeof this.modelViewer.createTexture === 'function',
        hasUpdateComplete: typeof this.modelViewer.updateComplete !== 'undefined',
        hasRequestUpdate: typeof this.modelViewer.requestUpdate === 'function',
        hasModel: typeof this.modelViewer.model !== 'undefined',
        createTextureType: typeof this.modelViewer.createTexture,
        availableMethods: Object.getOwnPropertyNames(this.modelViewer).filter(name => typeof this.modelViewer[name] === 'function')
      });
      
      // Ensure the canvas is properly prepared
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas not properly initialized');
      }
      
      // Ensure canvas is in a clean state
      this.#ensureCleanCanvas();
      
      // Debug canvas state
      console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
      console.log('Canvas data URL length:', this.canvas.toDataURL().length);
      
      // Create texture using data URL approach
      console.log('Creating texture from canvas data URL...');
      
      // Convert canvas to data URL
      const dataURL = this.canvas.toDataURL('image/png');
      console.log('Canvas data URL created, length:', dataURL.length);
      
      // Create an image element from the data URL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataURL;
      });
      
      console.log('Image created from data URL successfully');
      
      // Create texture via model-viewer from data URL and apply to material
      console.log('Creating texture via element API from data URL...');
      const tex = await this.modelViewer.createTexture(dataURL);
      
      if (mat.pbrMetallicRoughness.setBaseColorTexture) {
        mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
        mat.pbrMetallicRoughness.setBaseColorTexture(tex);
        console.log('Base color texture set via setBaseColorTexture');
      } else if (mat.pbrMetallicRoughness.baseColorTexture?.setTexture) {
        mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
        mat.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
        console.log('Base color texture set via baseColorTexture.setTexture');
      } else {
        console.warn('No method available to set base color texture');
      }
      
      if (mat.setEmissiveTexture) {
        mat.setEmissiveTexture(tex);
        mat.setEmissiveFactor([1, 1, 1]);
        console.log('Emissive texture set');
      }
      
      // Force a model update to ensure changes are applied
      this.modelViewer.requestUpdate();
      
      // Wait a bit for the update to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Debug the material state after our changes
      console.log('Material state after texture application:', {
        hasBaseColorTexture: !!mat.pbrMetallicRoughness.baseColorTexture,
        baseColorFactor: mat.pbrMetallicRoughness.baseColorFactor,
        hasEmissiveTexture: !!mat.emissiveTexture,
        emissiveFactor: mat.emissiveFactor
      });
      
      // Verify that the texture was properly set after update
      if (mat.pbrMetallicRoughness.baseColorTexture) {
        console.log('Base color texture verified after update:', mat.pbrMetallicRoughness.baseColorTexture);
      }
      
      if (mat.emissiveTexture) {
        console.log('Emissive texture verified after update:', mat.emissiveTexture);
      }
      
      // Final verification that the texture was applied and is working
      console.log('Final material state:', {
        hasBaseColorTexture: !!mat.pbrMetallicRoughness.baseColorTexture,
        hasEmissiveTexture: !!mat.emissiveTexture,
        baseColorFactor: mat.pbrMetallicRoughness.baseColorFactor,
        emissiveFactor: mat.emissiveFactor
      });
      
      // Additional verification that the texture is working
      if (img && typeof img === 'object') {
        console.log('Texture object properties:', Object.keys(img));
        console.log('Texture object prototype:', Object.getPrototypeOf(img));
      }
      
      // Final verification that the texture was applied and is working
      console.log('Texture application complete. Model should now display the new texture.');
    } catch (error) {
      console.error('Failed to create texture from canvas:', error);
      throw new Error(`Failed to apply texture: ${error.message}`);
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
    
    // Reset any other context properties that might interfere
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  async #loadImageFromFile(file) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    try {
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Validate that the image loaded properly
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            reject(new Error('Image failed to load properly'));
            return;
          }
          resolve();
        };
        img.onerror = (e) => {
          console.error('Image load error:', e);
          reject(new Error('Failed to load image file'));
        };
        img.src = url;
      });
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
      return img;
    } catch (error) {
      console.error('Error in image loading:', error);
      throw error;
    }
  }
}