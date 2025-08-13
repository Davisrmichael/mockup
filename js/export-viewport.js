
// export-viewport.js — export exactly what the <model-viewer> canvas shows (720×720)
export function makeExporter(mv){
  async function exportViewerPNG(){
    await mv.updateComplete;
    const blob = await mv.toBlob({ mimeType:'image/png', quality:1.0, idealAspect:1 });
    return URL.createObjectURL(blob);
  }
  return { exportViewerPNG };
}
