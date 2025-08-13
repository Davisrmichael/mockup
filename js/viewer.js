
// viewer.js — wraps <model-viewer> and provides helpers
export async function createViewer(mvElement, { startYawDeg = 180 } = {}){
  const mv = mvElement;

  // Wait for model to load
  await mv.updateComplete;

  // Ensure front-on (180° yaw), camera framed & centered
  // phi 90deg = front; radius auto keeps full model in frame
  mv.cameraOrbit = `${startYawDeg}deg 90deg auto`;
  mv.cameraTarget = 'auto';
  mv.fieldOfView = '25deg';

  function getMaterials(){
    return mv.model?.materials || [];
  }

  function findMaterialByName(name){
    return getMaterials().find(m => (m.name||'') === name) || null;
  }

  return { mv, findMaterialByName };
}
