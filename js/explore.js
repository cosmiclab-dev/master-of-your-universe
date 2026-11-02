// Master of Your Universe: explore the finished floor in real 3D (three.js r128, bundled).
// Drag to rotate, scroll or pinch to zoom, right-drag to pan, W A S D to walk, jump between spaces, eye-level view.
(() => {
  const ZONES = {all: {c: [15, 7], r: 17, name: 'Whole floor'}, s1: {c: [6.65, 7], r: 8, name: 'Team space'}, s2: {c: [18.3, 7], r: 7, name: 'Café'}, s3: {c: [26.65, 7], r: 5.5, name: 'Meeting room'}};
  function parseColor(c) {
    if (c.startsWith('#')) return {hex: new THREE.Color(c).convertSRGBToLinear(), a: 1};
    const m = c.match(/[\d.]+/g).map(Number); return {hex: new THREE.Color(m[0] / 255, m[1] / 255, m[2] / 255).convertSRGBToLinear(), a: m.length > 3 ? m[3] : 1};
  }
  let st = null;
  function open(picks, o = {}) {
    if (!window.THREE) return alertBox('The 3D viewer could not load.');
    close();
    const el = document.createElement('div'); el.className = 'explore'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Explore your floor in 3D');
    el.innerHTML = `<canvas class="ex-canvas"></canvas>
      <div class="ex-top"><div class="ex-title">${o.title || 'Explore your floor'}</div>
        <div class="ex-views">${Object.entries(ZONES).map(([k, z]) => `<button type="button" data-z="${k}">${z.name}</button>`).join('')}<button type="button" data-eye="1" class="eye">Eye level</button></div>
        <button type="button" class="gbtn blue round ex-x" aria-label="Close">✕</button></div>
      <div class="ex-hint">Drag to rotate · Scroll or pinch to zoom · Right-drag to move · W A S D to walk</div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas');
    const renderer = new THREE.WebGLRenderer({canvas: cv, antialias: true, preserveDrawingBuffer: true});
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#e8edf4').convertSRGBToLinear(); scene.fog = new THREE.Fog('#e8edf4', 60, 120);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 300);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c3cf, 0.75));
    const sun = new THREE.DirectionalLight(0xfff1dc, 0.95); sun.position.set(34, 26, -14); sun.target.position.set(15, 0, 7);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 90}); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xdde8ff, 0.25); fill.position.set(-20, 15, 30); scene.add(fill);
    // boxes -> one instanced mesh per material (fast enough for thousands of parts)
    const boxes = Builder.boxes('all', picks), groups = new Map(); let flatN = 0;
    for (const b of boxes) { const k = b.c + (b.glow ? '|g' : '') + '|' + (b.a ?? 1); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
    const geo = new THREE.BoxGeometry(1, 1, 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (const [k, list] of groups) {
      const {hex, a} = parseColor(list[0].c), alpha = a * (list[0].a ?? 1), glass = alpha < 0.95;
      const mat = new THREE.MeshStandardMaterial({color: hex, roughness: glass ? 0.1 : 0.78, metalness: glass ? 0.1 : 0.04, transparent: glass, opacity: glass ? Math.max(0.18, alpha) : 1, depthWrite: !glass});
      if (list[0].glow) { mat.emissive = hex.clone(); mat.emissiveIntensity = 0.7; }
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((b, i) => { const lift = b.flat ? 0.002 * (++flatN % 40) : 0;
        m4.compose(new THREE.Vector3(b.x + b.w / 2, b.z + b.h / 2 + lift, b.y + b.d / 2), q, new THREE.Vector3(Math.max(b.w, 0.004), Math.max(b.h, 0.004), Math.max(b.d, 0.004))); mesh.setMatrixAt(i, m4); });
      mesh.castShadow = !glass && !list[0].flat; mesh.receiveShadow = true; scene.add(mesh);
    }
    const controls = new THREE.OrbitControls(camera, cv);
    Object.assign(controls, {enableDamping: true, dampingFactor: 0.08, screenSpacePanning: false, minDistance: 1.2, maxDistance: 70, maxPolarAngle: 1.48});
    let fly = null, eye = false, zone = o.focus && ZONES[o.focus] ? o.focus : 'all';
    function viewFor(z, eyeLevel) {
      const Z = ZONES[z], [cx, cz] = Z.c;
      if (eyeLevel) return {pos: new THREE.Vector3(cx - Z.r * 0.35, 1.6, cz + Z.r * 0.55), tgt: new THREE.Vector3(cx + Z.r * 0.1, 1.1, cz - Z.r * 0.2)};
      return {pos: new THREE.Vector3(cx - Z.r * 0.85, Z.r * 1.15, cz + Z.r * 1.35), tgt: new THREE.Vector3(cx, 0.4, cz)};
    }
    function go(z, eyeLevel, instant) {
      zone = z; eye = eyeLevel; const v = viewFor(z, eyeLevel);
      controls.minDistance = eyeLevel ? 0.2 : 1.2; controls.maxPolarAngle = eyeLevel ? 1.75 : 1.48;
      el.querySelectorAll('[data-z]').forEach(b => b.classList.toggle('on', b.dataset.z === z)); el.querySelector('.eye').classList.toggle('on', eyeLevel);
      if (instant) { camera.position.copy(v.pos); controls.target.copy(v.tgt); return; }
      fly = {t0: performance.now(), p0: camera.position.clone(), t0v: controls.target.clone(), v};
    }
    el.querySelector('.ex-views').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.eye) go(zone === 'all' ? (o.focus || 's1') : zone, !eye); else go(b.dataset.z, false); };
    el.querySelector('.ex-x').onclick = close;
    const keys = new Set();
    const kd = e => { if (e.key === 'Escape') return close(); keys.add(e.key.toLowerCase()); }, ku = e => keys.delete(e.key.toLowerCase());
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    function resize() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    addEventListener('resize', resize); resize(); go(zone, false, true);
    let raf, last = performance.now();
    (function loop(now) {
      raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fly) { const t = Math.min(1, (now - fly.t0) / 900), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        camera.position.lerpVectors(fly.p0, fly.v.pos, e); controls.target.lerpVectors(fly.t0v, fly.v.tgt, e); if (t >= 1) fly = null; }
      // walk: move camera and target together on the floor plane
      const f = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0), r = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      if (f || r) { const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize(); const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const mv = dir.multiplyScalar(f).add(side.multiplyScalar(r)).multiplyScalar((eye ? 2.2 : 6) * dt); camera.position.add(mv); controls.target.add(mv); fly = null; }
      controls.update(); renderer.render(scene, camera);
    })(last);
    st = {el, renderer, controls, geo, raf: () => raf, kd, ku, resize, scene};
  }
  function close() {
    if (!st) return; cancelAnimationFrame(st.raf()); removeEventListener('keydown', st.kd); removeEventListener('keyup', st.ku); removeEventListener('resize', st.resize);
    st.controls.dispose(); st.scene.traverse(o => { if (o.material) o.material.dispose(); }); st.geo.dispose(); st.renderer.dispose(); st.el.remove(); st = null;
  }
  function alertBox(t) { const d = document.createElement('div'); d.className = 'toast bad'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2500); }
  window.Explore = {open, close};
})();
