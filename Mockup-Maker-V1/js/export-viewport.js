export function makeExporter(viewer) {
  async function exportViewerPNG() {
    const canvas = viewer?.renderer?.domElement;
    if (!canvas) throw new Error('Viewer canvas missing.');
    return canvas.toDataURL('image/png');
  }
  return { exportViewerPNG };
}
