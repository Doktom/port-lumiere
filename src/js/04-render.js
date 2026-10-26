// =====================================================================
// Rendu : toon + contours fins + reflets d'eau + halo du soleil
// =====================================================================
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const QUALITY = { reflect: true, pr: Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2) };
let PR = QUALITY.pr;
renderer.setPixelRatio(PR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fe0f2');
scene.fog = new THREE.Fog('#bfe8f2', 30, 95);
const camera = new THREE.PerspectiveCamera(32, 1, 1, 240);
camera.layers.enable(1);

const hemi = new THREE.HemisphereLight('#d6ecff', '#7c8f6c', 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -21, right: 21, top: 21, bottom: -21, near: 1, far: 90 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target);
// Réserve de lumières ponctuelles : réaffectées chaque image aux torches les plus proches
const LIGHT_POOL = [];
for (let k = 0; k < 6; k++) { const L = new THREE.PointLight('#ffb866', 0, 9, 1.6); L.position.set(0, -50, 0); scene.add(L); LIGHT_POOL.push(L); }

const gradTex = new THREE.DataTexture(new Uint8Array([64, 150, 255]), 3, 1, THREE.RedFormat);
gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter; gradTex.generateMipmaps = false; gradTex.needsUpdate = true;

function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const TEX = {
  plank: canvasTex(32, 128, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 12; k++) { x.fillStyle = 'rgba(70,40,20,.22)'; x.fillRect(0, k * (h / 12), w, 3); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, k * (h / 12) + 3, w, 2); }
  }),
  zinc: canvasTex(32, 8, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(0, 0, 6, h); x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(6, 0, 4, h);
  }),
  thatch: canvasTex(32, 32, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(80,50,10,.28)'; x.lineWidth = 2;
    for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(k * 6 + 2, 0); x.lineTo(k * 6 - 2, h); x.stroke(); }
  }),
};
const matCache = new Map();
function toon(color, opts) {
  const key = color + (opts ? JSON.stringify(opts) : '');
  if (!matCache.has(key)) {
    const o = { ...(opts || {}) }; delete o.flatShading;
    if (o.mapName) { o.map = TEX[o.mapName]; delete o.mapName; }
    matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: gradTex, ...o }));
  }
  return matCache.get(key);
}
const winMat = new THREE.MeshBasicMaterial({ color: '#4f8fae' });
const lampMat = new THREE.MeshBasicMaterial({ color: '#f1e6c4' });
const fireMat = new THREE.MeshBasicMaterial({ color: '#ffb347' });
const beamMat = new THREE.MeshBasicMaterial({ color: '#fff0b8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

// Vent : feuillage animé dans le vertex shader
const WIND = { uTime: { value: 0 }, uWind: { value: 0.8 } };
const swayMats = [];
function swayMat(color, axis = 'z', amp = 0.07, opts = {}) {
  const o2 = { ...opts }; delete o2.flatShading;
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradTex, ...o2 });
  m.userData.base = new THREE.Color(color);
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
    const move = axis === 'z'
      ? `transformed.y += sin(uTime*1.7 + ph + position.z*1.6) * ${amp.toFixed(3)} * uWind * position.z; transformed.x += sin(uTime*1.1 + ph*1.3) * ${(amp * 0.4).toFixed(3)} * uWind * position.z;`
      : `transformed.x += sin(uTime*2.1 + ph) * ${amp.toFixed(3)} * uWind * (position.y + 0.5); transformed.z += cos(uTime*1.6 + ph) * ${(amp * 0.6).toFixed(3)} * uWind * (position.y + 0.5);`;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;
      #else
      float ph = 0.0;
      #endif
      ${move}`);
  };
  swayMats.push(m);
  return m;
}

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  sph: new THREE.SphereGeometry(1, 14, 10),
  ico: new THREE.IcosahedronGeometry(1, 1),
  ico0: new THREE.IcosahedronGeometry(1, 0),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  rock: new THREE.DodecahedronGeometry(1, 0),
};
function part(parent, geo, c, s, p, r) {
  const m = new THREE.Mesh(geo, typeof c === 'string' ? toon(c) : c);
  m.scale.set(s[0], s[1], s[2]); m.position.set(p[0], p[1], p[2]);
  if (r) m.rotation.set(r[0], r[1], r[2]);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const dummy = new THREE.Object3D(), tmpC = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0), tmpD = new THREE.Vector3();
dummy.rotation.order = 'YXZ';
function batch(geo, max, opts = {}) {
  const m = new THREE.InstancedMesh(geo, opts.mat || toon('#ffffff', opts.flat ? { flatShading: true } : undefined), max);
  m.count = 0; m.castShadow = opts.cast !== false; m.receiveShadow = true; m.frustumCulled = false;
  m.put = (x, y, z, sx, sy, sz, ry = 0, col = '#ffffff', rx = 0, rz = 0) => {
    if (m.count >= max) return -1;
    dummy.quaternion.identity(); dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix();
    const k = m.count++; m.setMatrixAt(k, dummy.matrix); m.setColorAt(k, tmpC.set(col)); return k;
  };
  // Cylindre unitaire orienté de a vers b (troncs, bambous)
  m.putDir = (ax, ay, az, bx, by, bz, rad, col = '#ffffff') => {
    if (m.count >= max) return -1;
    tmpD.set(bx - ax, by - ay, bz - az); const len = tmpD.length();
    dummy.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); dummy.quaternion.setFromUnitVectors(UP, tmpD.normalize()); dummy.scale.set(rad, len, rad); dummy.updateMatrix();
    const k = m.count++; m.setMatrixAt(k, dummy.matrix); m.setColorAt(k, tmpC.set(col)); return k;
  };
  m.set = (k, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) => {
    dummy.quaternion.identity(); dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); m.setMatrixAt(k, dummy.matrix);
  };
  m.hide = k => { dummy.quaternion.identity(); dummy.rotation.set(0, 0, 0); dummy.position.set(0, -50, 0); dummy.scale.set(0, 0, 0); dummy.updateMatrix(); m.setMatrixAt(k, dummy.matrix); m.instanceMatrix.needsUpdate = true; };
  m.flush = () => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
  scene.add(m); return m;
}

// Post-traitement : contours (profondeur + normales), étalonnage, halo, éclair
const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: null }, tDepth: { value: null }, tNormal: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) }, uNear: { value: camera.near }, uFar: { value: camera.far },
    uThick: { value: 1 }, uInk: { value: new THREE.Vector3(0.14, 0.1, 0.18) },
    uGrade: { value: new THREE.Vector3(1, 1, 1) }, uGlowCol: { value: new THREE.Vector3(1, 0.7, 0.4) },
    uGlowPos: { value: new THREE.Vector2(0.7, 1.2) }, uGlowAmt: { value: 0 }, uGlowK: { value: 2.0 }, uAspect: { value: 1.5 },
    uFlash: { value: 0 }, uVig: { value: 0.4 }, uSat: { value: 1.15 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tNormal;
    uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uThick; uniform vec3 uInk;
    uniform vec3 uGrade; uniform vec3 uGlowCol; uniform vec2 uGlowPos; uniform float uGlowAmt; uniform float uGlowK; uniform float uAspect;
    uniform float uFlash; uniform float uVig; uniform float uSat;
    varying vec2 vUv;
    float lin(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    void main(){
      vec2 px = uThick / uRes;
      float dc = lin(vUv);
      vec3 nc = nrm(vUv);
      float de = 0.0, ne = 0.0;
      vec2 o0 = vec2(px.x, 0.0), o1 = vec2(-px.x, 0.0), o2 = vec2(0.0, px.y), o3 = vec2(0.0, -px.y);
      de = max(de, (lin(vUv + o0) - dc) / dc);
      de = max(de, (lin(vUv + o1) - dc) / dc);
      de = max(de, (lin(vUv + o2) - dc) / dc);
      de = max(de, (lin(vUv + o3) - dc) / dc);
      ne = max(ne, 1.0 - dot(nc, nrm(vUv + o0)));
      ne = max(ne, 1.0 - dot(nc, nrm(vUv + o2)));
      float edge = max(smoothstep(0.004, 0.009, de), smoothstep(0.30, 0.55, ne));
      edge *= 1.0 - smoothstep(uFar * 0.25, uFar * 0.55, dc) * 0.6;
      vec3 col = texture2D(tColor, vUv).rgb;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = max(mix(vec3(l), col, uSat), 0.0);
      col = mix(col, col * uInk, edge * 0.92);
      col *= uGrade;
      vec2 gd = vUv - uGlowPos; gd.x *= uAspect;
      float gl = exp(-dot(gd, gd) * uGlowK);
      col += uGlowCol * (gl * uGlowAmt);
      col += vec3(uFlash);
      vec2 q = vUv - 0.5; col *= 1.0 - dot(q, q) * uVig;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); postQuad.frustumCulled = false; postScene.add(postQuad);

// Reflets planaires : seconde caméra miroir sous la surface de l'eau
const WATER_Y = -0.28;
const refCam = new THREE.PerspectiveCamera(); refCam.layers.set(0);
const refPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y - 0.02);
const refTexMat = new THREE.Matrix4(), refRot = new THREE.Matrix4(), rv1 = new THREE.Vector3(), rv2 = new THREE.Vector3();
let waterMesh = null, highlight = null;
let rtC = null, rtN = null, rtR = null;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(PR); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const bw = Math.max(1, Math.floor(w * PR)), bh = Math.max(1, Math.floor(h * PR));
  if (rtC) { rtC.depthTexture.dispose(); rtC.dispose(); rtN.dispose(); rtR.dispose(); }
  rtC = new THREE.WebGLRenderTarget(bw, bh, { type: THREE.HalfFloatType });
  rtC.depthTexture = new THREE.DepthTexture(bw, bh); rtC.depthTexture.type = THREE.UnsignedIntType;
  rtN = new THREE.WebGLRenderTarget(bw, bh);
  rtR = new THREE.WebGLRenderTarget(Math.max(1, bw >> 1), Math.max(1, bh >> 1), { type: THREE.HalfFloatType });
  rtR.texture.minFilter = rtR.texture.magFilter = THREE.LinearFilter;
  post.uniforms.tColor.value = rtC.texture; post.uniforms.tDepth.value = rtC.depthTexture; post.uniforms.tNormal.value = rtN.texture;
  post.uniforms.uRes.value.set(bw, bh); post.uniforms.uThick.value = PR * 0.85; post.uniforms.uAspect.value = w / h;
}
function updateReflection() {
  camera.updateMatrixWorld();
  const cp = camera.position, wy = WATER_Y;
  refRot.extractRotation(camera.matrixWorld);
  rv1.set(0, 0, -1).applyMatrix4(refRot).add(cp);                 // point visé par la caméra
  refCam.position.set(cp.x, 2 * wy - cp.y, cp.z);
  rv2.set(0, 1, 0).applyMatrix4(refRot); refCam.up.set(rv2.x, -rv2.y, rv2.z);
  refCam.lookAt(rv1.x, 2 * wy - rv1.y, rv1.z);
  refCam.near = camera.near; refCam.far = camera.far;
  refCam.projectionMatrix.copy(camera.projectionMatrix); refCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  refCam.updateMatrixWorld();
  refTexMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  refTexMat.multiply(refCam.projectionMatrix); refTexMat.multiply(refCam.matrixWorldInverse);
}
function render() {
  renderer.shadowMap.needsUpdate = true;
  const doRef = QUALITY.reflect && waterMesh;
  if (doRef) {
    updateReflection();
    waterMesh.material.uniforms.uTexMat.value.copy(refTexMat);
    waterMesh.visible = false; renderer.clippingPlanes = [refPlane];
    renderer.setRenderTarget(rtR); renderer.render(scene, refCam);
    renderer.clippingPlanes = []; waterMesh.visible = true;
  }
  if (waterMesh) { waterMesh.material.uniforms.uRef.value = rtR.texture; waterMesh.material.uniforms.uRefAmt.value = doRef ? 1 : 0; waterMesh.material.uniforms.uCam.value.copy(camera.position); }
  renderer.setRenderTarget(rtC); renderer.render(scene, camera);
  const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = normalMat; camera.layers.disable(1);
  renderer.setClearColor(0x8080ff, 1); renderer.setRenderTarget(rtN); renderer.render(scene, camera);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; camera.layers.enable(1); renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
