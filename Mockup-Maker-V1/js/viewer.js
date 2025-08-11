// THREE + helpers from esm.sh (no bare specifiers anywhere)
import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three-stdlib@2.29.6/controls/OrbitControls?deps=three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three-stdlib@2.29.6/loaders/GLTFLoader?deps=three@0.160.0';

export async function createViewer(containerEl, {
  modelUrl,
  startYawDeg = 0,
  enableControls = true
} = {}) {
  if (!containerEl) throw new Error('Viewer container element missing.');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.8, 2.1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(containerEl.clientWidth, containerEl.clientHeight, false);
  containerEl.innerHTML = '';
  containerEl.appendChild(renderer.domElement);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(3, 3, 4);
  scene.add(dir);

  let controls = null;
  if (enableControls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
  }

  // Resize
  const ro = new ResizeObserver(() => {
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  ro.observe(containerEl);

  // Load model
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const root = gltf.scene || gltf.scenes?.[0];
  if (!root) throw new Error('GLTF scene missing.');
  scene.add(root);

  // rotate model
  root.rotation.y = THREE.MathUtils.degToRad(startYawDeg);

  // Fit so it isn't cropped
  fitToObject(root);

  function fitToObject(object3D) {
    const box = new THREE.Box3().setFromObject(object3D);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    if (controls) controls.target.copy(sphere.center);

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = sphere.radius / Math.sin(fov / 2);
    camera.position.copy(sphere.center.clone().add(new THREE.Vector3(0, 0, dist)));
    camera.near = Math.max(0.01, dist - sphere.radius * 3);
    camera.far = dist + sphere.radius * 5;
    camera.updateProjectionMatrix();
    if (controls) controls.update();
  }

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function findMaterialByName(name) {
    let found = null;
    scene.traverse((obj) => {
      const mat = obj.material;
      if (!mat) return;
      if (Array.isArray(mat)) {
        mat.forEach(m => { if (m?.name === name) found = m; });
      } else if (mat.name === name) {
        found = mat;
      }
    });
    return found;
  }

  return {
    scene, camera, renderer, controls, root,
    dom: renderer.domElement,
    findMaterialByName
  };
}
