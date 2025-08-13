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
      
      // Check if createTexture method is available
      if (typeof this.modelViewer.createTexture !== 'function') {
        throw new Error('createTexture method not available on model-viewer');
      }
      
      console.log('Model materials:', this.modelViewer.model.materials.length);
      console.log('Screen material:', mat);
      console.log('createTexture method available:', typeof this.modelViewer.createTexture);
      
      // Ensure the canvas is properly prepared
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas not properly initialized');
      }
      
      // Ensure canvas is in a clean state
      this.#ensureCleanCanvas();
      
      // Debug canvas state
      console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
      console.log('Canvas data URL length:', this.canvas.toDataURL().length);
      
      let tex;
      
      try {
        // Try blob method first
        const blob = await new Promise(resolve => {
          this.canvas.toBlob(resolve, 'image/png');
        });
        
        if (!blob) {
          throw new Error('Failed to convert canvas to blob');
        }
        
        console.log('Blob created successfully, size:', blob.size);
        console.log('Blob type:', blob.type);
        
        // Create texture from blob
        console.log('Attempting to create texture from blob...');
        tex = await this.modelViewer.createTexture(blob);
        console.log('Texture created from blob successfully');
      } catch (blobError) {
        console.warn('Blob method failed, trying direct canvas method:', blobError);
        console.warn('Blob error details:', {
          name: blobError.name,
          message: blobError.message,
          stack: blobError.stack
        });
        
        try {
          // Fallback to direct canvas method
          console.log('Attempting to create texture from canvas directly...');
          tex = await this.modelViewer.createTexture(this.canvas);
          console.log('Texture created from canvas directly');
        } catch (canvasError) {
          console.error('Both blob and canvas methods failed:', canvasError);
          console.error('Canvas error details:', {
            name: canvasError.name,
            message: canvasError.message,
            stack: canvasError.stack
          });
          console.error('Canvas state:', {
            width: this.canvas.width,
            height: this.canvas.height,
            hasContext: !!this.ctx,
            contextState: this.ctx ? 'valid' : 'invalid'
          });
          
          // Try to get more information about the model-viewer state
          console.error('Model-viewer state:', {
            hasModel: !!this.modelViewer.model,
            modelMaterials: this.modelViewer.model?.materials?.length || 0,
            createTextureType: typeof this.modelViewer.createTexture,
            modelViewerReady: this.modelViewer.readyState
          });
          
          // Try to get more information about the canvas
          try {
            const dataURL = this.canvas.toDataURL();
            console.error('Canvas data URL length:', dataURL.length);
            console.error('Canvas data URL preview:', dataURL.substring(0, 100) + '...');
          } catch (dataURLError) {
            console.error('Failed to get canvas data URL:', dataURLError);
          }
          
          // Try to get more information about the model-viewer methods
          console.error('Model-viewer methods:', {
            hasCreateTexture: typeof this.modelViewer.createTexture === 'function',
            hasUpdateComplete: typeof this.modelViewer.updateComplete !== 'undefined',
            hasRequestUpdate: typeof this.modelViewer.requestUpdate === 'function',
            hasModel: typeof this.modelViewer.model !== 'undefined'
          });
          
          // Try to get more information about the model-viewer properties
          console.error('Model-viewer properties:', {
            readyState: this.modelViewer.readyState,
            loading: this.modelViewer.loading,
            modelStatus: this.modelViewer.modelStatus,
            hasModel: !!this.modelViewer.model
          });
          
          throw new Error(`Texture creation failed: ${canvasError.message}`);
        }
      }
      
      // Validate texture object
      if (!tex) {
        throw new Error('Texture creation failed - no texture object returned');
      }
      
      // Check if the texture has the expected properties
      if (typeof tex !== 'object') {
        throw new Error(`Texture creation failed - unexpected type: ${typeof tex}`);
      }
      
      console.log('Texture object:', tex);
      console.log('Texture type:', typeof tex);
      console.log('Texture constructor:', tex.constructor.name);
      
      if (mat.pbrMetallicRoughness.setBaseColorTexture) {
        try {
          mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
          mat.pbrMetallicRoughness.setBaseColorTexture(tex);
          console.log('Base color texture set via setBaseColorTexture');
        } catch (error) {
          console.error('Failed to set base color texture via setBaseColorTexture:', error);
          throw error;
        }
      } else if (mat.pbrMetallicRoughness.baseColorTexture?.setTexture) {
        try {
          mat.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
          mat.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
          console.log('Base color texture set via baseColorTexture.setTexture');
        } catch (error) {
          console.error('Failed to set base color texture via baseColorTexture.setTexture:', error);
          throw error;
        }
      } else {
        console.warn('No suitable method found to set base color texture');
      }
      
      if (mat.setEmissiveTexture) {
        try {
          mat.setEmissiveTexture(tex);
          mat.setEmissiveFactor([1, 1, 1]);
          console.log('Emissive texture set');
        } catch (error) {
          console.error('Failed to set emissive texture:', error);
          throw error;
        }
      } else {
        console.warn('No setEmissiveTexture method found');
      }
      
      console.log('Texture applied to material successfully');
      
      // Force a model update to ensure changes are applied
      this.modelViewer.requestUpdate();
      
      // Wait a bit for the update to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify that the texture was properly set after update
      if (mat.pbrMetallicRoughness.baseColorTexture) {
        console.log('Base color texture verified after update:', mat.pbrMetallicRoughness.baseColorTexture);
      }
      
      if (mat.emissiveTexture) {
        console.log('Emissive texture verified after update:', mat.emissiveTexture);
      }
      
      // Final verification that the texture was applied
      console.log('Final material state:', {
        hasBaseColorTexture: !!mat.pbrMetallicRoughness.baseColorTexture,
        hasEmissiveTexture: !!mat.emissiveTexture,
        baseColorFactor: mat.pbrMetallicRoughness.baseColorFactor,
        emissiveFactor: mat.emissiveFactor
      });
      
      // Additional verification that the texture is working
      if (tex && typeof tex === 'object') {
        console.log('Texture object properties:', Object.keys(tex));
        console.log('Texture object prototype:', Object.getPrototypeOf(tex));
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