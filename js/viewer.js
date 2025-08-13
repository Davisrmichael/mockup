export async function initViewer(modelViewer) {
  if (!modelViewer) throw new Error('model-viewer element not found');
  await modelViewer.updateComplete;
  modelViewer.cameraOrbit = '180deg 90deg auto';
  modelViewer.cameraTarget = 'auto';
  modelViewer.fieldOfView = '25deg';
}

export function getScreenMaterial(modelViewer) {
  const materials = modelViewer.model?.materials || [];
  return materials.find(m => (m.name || '') === 'Screen') || null;
}