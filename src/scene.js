import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Builds the 3D room. Returns { update(), setState(id, on), onApplianceClick(cb) }.
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x13202a);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(5.5, 4.5, 7.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.4, 0);
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 4;
  controls.maxDistance = 14;
  controls.update();

  // Base lighting (dim, so the room looks darker when the light is OFF)
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 0.35);
  sun.position.set(5, 8, 6);
  scene.add(sun);

  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const box = (w, h, d, color, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---- Room: floor + 3 walls (front is open so we can see inside) ----
  box(8, 0.2, 8, 0xb08358, 0, -0.1, 0);            // floor
  box(8, 3.5, 0.2, 0xe4e9e1, 0, 1.75, -4);         // back wall
  box(0.2, 3.5, 8, 0xcdd6cc, -4, 1.75, 0);         // left wall
  box(0.2, 3.5, 8, 0xcdd6cc, 4, 1.75, 0);          // right wall

  // Door on left wall
  box(0.1, 2.4, 1.3, 0x5d4037, -3.88, 1.2, 1.5);
  box(0.05, 0.1, 0.1, 0xffd54f, -3.8, 1.2, 1.1);   // knob

  // ---- Furniture ----
  // Sofa
  box(2.4, 0.5, 1, 0x2f6f73, 0, 0.25, 2.2);
  box(2.4, 0.8, 0.25, 0x255a5e, 0, 0.7, 2.6);
  box(0.25, 0.7, 1, 0x255a5e, -1.2, 0.5, 2.2);
  box(0.25, 0.7, 1, 0x255a5e, 1.2, 0.5, 2.2);
  // Coffee table
  box(1.4, 0.1, 0.8, 0x6d4c41, 0, 0.45, 0.8);
  [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(([x, z]) =>
    box(0.08, 0.4, 0.08, 0x4e342e, x, 0.2, 0.8 + z));
  // Rug
  box(3, 0.02, 2.2, 0xe0c58a, 0, 0.01, 0.9);


  // Window on the right wall
  box(0.06, 1.6, 2.2, 0xf3f4f0, 3.86, 2, -1);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.4),
    new THREE.MeshBasicMaterial({ color: 0x9fc9e8 }));
  glass.rotation.y = -Math.PI / 2; glass.position.set(3.82, 2, -1); scene.add(glass);
  box(0.08, 1.4, 0.06, 0xf3f4f0, 3.8, 2, -1); box(0.08, 0.06, 2, 0xf3f4f0, 3.8, 2, -1);

  // Framed picture on back wall
  box(1.1, 0.8, 0.06, 0x3b2f2a, -2.7, 2.3, -3.87);
  box(0.95, 0.65, 0.07, 0xd98e5f, -2.7, 2.3, -3.86);
  box(0.4, 0.4, 0.08, 0x2f6f73, -2.55, 2.25, -3.85);

  // Plant in the corner
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 20), mat(0xb5603d));
  pot.position.set(3.2, 0.25, -3.2); pot.castShadow = true; scene.add(pot);
  [[0,0.9,0,0.45],[0.2,1.2,0.1,0.32],[-0.2,1.15,-0.1,0.3]].forEach(([x,y,z,r]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(0x3f7d4e));
    leaf.position.set(3.2 + x, y, -3.2 + z); leaf.castShadow = true; scene.add(leaf);
  });

  // Clickable meshes list
  const clickable = [];
  const tag = (obj, id) => {
    obj.traverse((o) => { o.userData.applianceId = id; if (o.isMesh) clickable.push(o); });
  };

  // ---- TV (on a stand against the back wall) ----
  box(3, 0.6, 0.8, 0x4e342e, 0, 0.3, -3.5); // TV stand
  const tv = new THREE.Group();
  tv.position.set(0, 1.6, -3.6);
  const tvFrame = box(2.6, 1.5, 0.12, 0x111111, 0, 0, 0, tv);
  const tvScreenMat = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x000000 });
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), tvScreenMat);
  tvScreen.position.z = 0.07;
  tv.add(tvScreen);
  box(0.2, 0.3, 0.2, 0x111111, 0, -0.9, 0, tv);
  scene.add(tv);
  tag(tv, 'tv');
  const tvLight = new THREE.PointLight(0x66aaff, 0, 6);
  tvLight.position.set(0, 1.6, -2.8);
  scene.add(tvLight);

  // ---- Ceiling light (hanging bulb) ----
  const lightGroup = new THREE.Group();
  lightGroup.position.set(-1.6, 3.5, 0);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), mat(0x222222));
  cord.position.y = -0.3;
  lightGroup.add(cord);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe066, emissiveIntensity: 2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), bulbMat);
  bulb.position.y = -0.8;
  lightGroup.add(bulb);
  scene.add(lightGroup);
  tag(lightGroup, 'light');
  const bulbLight = new THREE.PointLight(0xffe9a8, 40, 14);
  bulbLight.position.set(-1.6, 2.6, 0);
  bulbLight.castShadow = true;
  scene.add(bulbLight);

  // ---- Ceiling fan ----
  const fan = new THREE.Group();
  fan.position.set(1.6, 3.5, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), mat(0x333333));
  rod.position.y = -0.2;
  fan.add(rod);
  const blades = new THREE.Group();
  blades.position.y = -0.45;
  blades.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20), mat(0x444444)));
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    const blade = box(1.2, 0.03, 0.3, 0xe5e7eb, 0.75, 0, 0, arm);
    arm.rotation.y = (i * Math.PI * 2) / 3;
    blades.add(arm);
  }
  fan.add(blades);
  scene.add(fan);
  tag(fan, 'fan');

  // ---- State ----
  const state = { light: true, fan: true, tv: true };
  function setState(id, on) {
    state[id] = on;
    if (id === 'light') {
      bulbLight.intensity = on ? 40 : 0;
      bulbMat.emissive.set(on ? 0xffe066 : 0x000000);
      bulbMat.color.set(on ? 0xffffff : 0x777777);
    }
    if (id === 'tv') {
      tvLight.intensity = on ? 3 : 0;
      if (!on) { tvScreenMat.color.set(0x050505); tvScreenMat.emissive.set(0x000000); }
    }
  }
  Object.entries(state).forEach(([id, on]) => setState(id, on));

  // ---- Click handling ----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let clickCb = () => {};
  let downPos = null;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downPos || Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 5) return; // was a drag
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(clickable, false)[0];
    if (hit) clickCb(hit.object.userData.applianceId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    canvas.style.cursor = raycaster.intersectObjects(clickable, false).length ? 'pointer' : 'grab';
  });

  // ---- Resize ----
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(container);
  resize();

  // ---- Animation loop ----
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (state.fan) blades.rotation.y += 0.25;
    if (state.tv) {
      const c = new THREE.Color().setHSL((t * 0.1) % 1, 0.8, 0.5);
      tvScreenMat.color.copy(c);
      tvScreenMat.emissive.copy(c);
      tvScreenMat.emissiveIntensity = 0.8;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { setState, onApplianceClick: (cb) => (clickCb = cb) };
}
