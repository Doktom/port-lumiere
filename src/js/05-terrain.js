// =====================================================================
// Sol, berges et eau
// =====================================================================
let groundMat;
function buildGround() {
  const P = [], N = [], C = [];
  const COL = {
    gA: new THREE.Color('#79d055'), gB: new THREE.Color('#46ae4a'), gC: new THREE.Color('#a8e46a'),
    path: new THREE.Color('#e3a56b'), sand: new THREE.Color('#fbe7a8'), bank: new THREE.Color('#9a6a46'), bankS: new THREE.Color('#d9bd7e'), apron: new THREE.Color('#3b9a48'),
    pzA: new THREE.Color('#f6e5b6'), pzB: new THREE.Color('#efd39a'), rRed: new THREE.Color('#e2503f'), rGold: new THREE.Color('#f6c026'), rGreen: new THREE.Color('#35b24f'), pzMid: new THREE.Color('#2fb6a7'),
  };
  const tc = new THREE.Color();
  function cornerCol(t, x, z, i, j) {
    const n = vnoise(x * 0.17, z * 0.17), m = vnoise(x * 0.55 + 7, z * 0.55 + 3);
    if (t === GRASS) { tc.copy(COL.gA).lerp(COL.gB, n); if (m > 0.7) tc.lerp(COL.gC, 0.45); }
    else if (t === PATH) tc.copy(COL.path).multiplyScalar(0.93 + m * 0.1);
    else if (t === PLAZA) {
      const dx = i + 0.5 - PLAZA_C[0], dz = j + 0.5 - PLAZA_C[1], d = Math.hypot(dx, dz);
      if (d < 2.7) tc.copy(COL.pzMid);
      else if (d < 3.3) tc.copy(COL.rGold);
      else if (d < 4.5) { const a = Math.floor((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2) * 12) % 3; tc.copy([COL.rRed, COL.rGold, COL.rGreen][a]); }
      else tc.copy(((i + j) & 1) ? COL.pzA : COL.pzB);
    }
    else if (t === SAND) tc.copy(COL.sand).multiplyScalar(0.96 + m * 0.06);
    else tc.copy(COL.apron).multiplyScalar(0.9 + n * 0.15);
    return [tc.r, tc.g, tc.b];
  }
  function quad(a, b, c, d, n, ca, cb, cc, cd) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
    const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { [b, d] = [d, b]; [cb, cd] = [cd, cb]; }
    for (const [v, col] of [[a, ca], [b, cb], [c, cc], [a, ca], [c, cc], [d, cd]]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); }
  }
  const DEP = -0.75;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const t = tiles[id(i, j)];
    if (isWater(t)) continue;
    quad([i, 0, j], [i, 0, j + 1], [i + 1, 0, j + 1], [i + 1, 0, j], [0, 1, 0],
      cornerCol(t, i, j, i, j), cornerCol(t, i, j + 1, i, j), cornerCol(t, i + 1, j + 1, i, j), cornerCol(t, i + 1, j, i, j));
    const bc = t === SAND ? COL.bankS : COL.bank;
    const top = [bc.r * 1.12, bc.g * 1.12, bc.b * 1.12], bot = [bc.r * 0.62, bc.g * 0.62, bc.b * 0.62];
    if (isWater(tileAt(i, j + 1))) quad([i, 0, j + 1], [i + 1, 0, j + 1], [i + 1, DEP, j + 1], [i, DEP, j + 1], [0, 0, 1], top, top, bot, bot);
    if (isWater(tileAt(i, j - 1))) quad([i, 0, j], [i + 1, 0, j], [i + 1, DEP, j], [i, DEP, j], [0, 0, -1], top, top, bot, bot);
    if (isWater(tileAt(i + 1, j))) quad([i + 1, 0, j], [i + 1, 0, j + 1], [i + 1, DEP, j + 1], [i + 1, DEP, j], [1, 0, 0], top, top, bot, bot);
    if (isWater(tileAt(i - 1, j))) quad([i, 0, j], [i, 0, j + 1], [i, DEP, j + 1], [i, DEP, j], [-1, 0, 0], top, top, bot, bot);
  }
  // Tablier extérieur (forêt hors carte)
  const ap = (x0, z0, x1, z1, t) => quad([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [0, 1, 0],
    cornerCol(t, x0, z0, 0, 0), cornerCol(t, x0, z1, 0, 0), cornerCol(t, x1, z1, 0, 0), cornerCol(t, x1, z0, 0, 0));
  ap(-70, -70, 0, coastZ(0) - 4, 9); ap(W, -70, W + 70, coastZ(W - 1) - 4, 9); ap(0, -70, W, 0, 9);
  ap(-70, coastZ(0) - 4, 0, coastZ(0), SAND); ap(W, coastZ(W - 1) - 4, W + 70, coastZ(W - 1), SAND);
  const bs = [COL.bankS.r, COL.bankS.g, COL.bankS.b], bs2 = [COL.bankS.r * 0.6, COL.bankS.g * 0.6, COL.bankS.b * 0.6];
  quad([-70, 0, coastZ(0)], [0, 0, coastZ(0)], [0, DEP, coastZ(0)], [-70, DEP, coastZ(0)], [0, 0, 1], bs, bs, bs2, bs2);
  quad([W, 0, coastZ(W - 1)], [W + 70, 0, coastZ(W - 1)], [W + 70, DEP, coastZ(W - 1)], [W, DEP, coastZ(W - 1)], [0, 0, 1], bs, bs, bs2, bs2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  groundMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex });
  const m = new THREE.Mesh(geo, groundMat);
  m.receiveShadow = true; scene.add(m);
}

function buildWater() {
  // Masque : distance au rivage (écume et bandes de couleur), rivière vs mer
  const dist = new Float32Array(W * H).fill(99), q = [];
  for (let k = 0; k < W * H; k++) if (!isWater(tiles[k])) { dist[k] = 0; q.push(k); }
  for (let h = 0; h < q.length; h++) {
    const k = q[h], i = k % W, j = (k / W) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj; if (!inMap(ni, nj)) continue;
      const nk = id(ni, nj), nd = dist[k] + (di && dj ? 1.41 : 1);
      if (nd < dist[nk]) { dist[nk] = nd; q.push(nk); }
    }
  }
  const data = new Uint8Array(W * H * 4);
  for (let k = 0; k < W * H; k++) {
    data[k * 4] = isWater(tiles[k]) ? 255 : 0;
    data[k * 4 + 1] = Math.round(clamp(dist[k] / 8, 0, 1) * 255);
    data[k * 4 + 2] = tiles[k] === RIVER ? 255 : 0; data[k * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMask: { value: tex }, uRef: { value: null }, uTexMat: { value: new THREE.Matrix4() }, uRefAmt: { value: 1 },
      uTime: { value: 0 }, uSize: { value: new THREE.Vector2(W, H) }, uTint: { value: new THREE.Color('#ffffff') }, uCam: { value: new THREE.Vector3() },
      uGlintDir: { value: new THREE.Vector3(0.3, 0.8, -0.6) }, uGlintCol: { value: new THREE.Color('#fff4c8') }, uGlintAmt: { value: 1 },
      uFogCol: { value: new THREE.Color('#bfe8f2') }, uFogN: { value: 30 }, uFogF: { value: 95 },
      cS: { value: new THREE.Color('#7ff0d8') }, cM: { value: new THREE.Color('#1fc3d6') }, cD: { value: new THREE.Color('#1a86cc') }, cF: { value: new THREE.Color('#f4fcff') },
    },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform sampler2D uMask; uniform sampler2D uRef; uniform mat4 uTexMat;
      uniform float uTime, uRefAmt, uGlintAmt, uFogN, uFogF;
      uniform vec2 uSize; uniform vec3 uTint, cS, cM, cD, cF, uCam, uGlintDir, uGlintCol, uFogCol;
      varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1.0, 0.0)), u.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), u.x), u.y); }
      void main(){
        vec2 uv = vW.xz / uSize;
        vec4 m = texture2D(uMask, clamp(uv, vec2(0.0), vec2(1.0)));
        float d = m.g * 8.0;
        if (uv.y > 1.0) d = 8.0;
        float river = m.b;
        float wob = n2(vW.xz * 0.6 + uTime * 0.15) * 0.6;
        float dd = d + wob - 0.3;
        vec3 col = cS;
        if (dd > 1.7 - river * 0.6) col = cM;
        if (dd > 4.0) col = cD;
        vec2 flow = vec2(uTime * 0.22, uTime * 0.1) - vec2(0.0, uTime * 1.3) * river;
        float g = n2(vW.xz * vec2(1.5, 1.5 - river * 1.1) + flow) * 0.6 + n2(vW.xz * 0.7 - flow * 0.6 + 5.0) * 0.4;
        col = mix(col, cF, step(0.76, g) * 0.32);
        float fe = 0.8 + sin(uTime * 1.8 + vW.x * 0.9 + vW.z * 0.6) * 0.14;
        float foam = 1.0 - step(fe, d + wob * 0.35);
        float ring = fract(d * 0.55 - uTime * 0.18);
        float rf = step(0.93, ring) * (1.0 - step(2.6, d)) * step(1.0, d) * (1.0 - river);
        col = mix(col, cF, max(foam, rf * 0.75));
        col *= uTint;
        // reflet du décor (carte miroir déformée par les vaguelettes), posterisé
        vec2 wv = vec2(n2(vW.xz * 1.6 + vec2(uTime * 0.35, 0.0)), n2(vW.xz * 1.6 + vec2(11.0, -uTime * 0.3))) - 0.5;
        vec4 rc = uTexMat * vec4(vW, 1.0);
        vec2 ruv = clamp(rc.xy / rc.w + wv * 0.03, vec2(0.002), vec2(0.998));
        vec3 refl = texture2D(uRef, ruv).rgb;
        float rk = floor((0.24 + river * 0.1) * 5.0 + 0.5) / 5.0 * uRefAmt * (1.0 - max(foam, rf * 0.75));
        col = mix(col, refl, rk);
        // scintillement du soleil
        vec3 V = normalize(uCam - vW);
        vec2 gn = vec2(n2(vW.xz * 2.4 + uTime * 0.6), n2(vW.xz * 2.4 + 23.0 - uTime * 0.5)) - 0.5;
        vec3 N = normalize(vec3(gn.x * 0.8, 1.0, gn.y * 0.8));
        vec3 R = reflect(-V, N);
        float sp = max(dot(R, normalize(uGlintDir)), 0.0);
        float tw = step(0.5, n2(vW.xz * 5.0 + uTime * 1.6));
        col += uGlintCol * (smoothstep(0.975, 0.995, sp) * 0.85 * tw + pow(sp, 14.0) * 0.07) * uGlintAmt;
        float dist = length(uCam - vW);
        col = mix(col, uFogCol, smoothstep(uFogN, uFogF, dist));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  mat.uniforms.uRef.value = rtR.texture;
  waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(W + 260, H + 260), mat);
  waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(W / 2, WATER_Y, H / 2 + 60);
  scene.add(waterMesh);
}
