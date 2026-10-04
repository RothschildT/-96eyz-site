// The set: five congas you can play. Click a drumhead to go through it.
// The <a data-drum> links in index.html are the real navigation; this file only dresses them up.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const body = document.body;
const canvas = document.getElementById('stage');
const links = [...document.querySelectorAll('[data-drum]')];
const curtain = document.querySelector('.curtain');
const soundBtn = document.querySelector('.sound-toggle');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// size, pitch and badge for each drum come from its link, so the HTML stays the one place to edit
const DRUMS = links.map((a) => ({
  scale: parseFloat(a.dataset.scale) || 1,
  freq: parseFloat(a.dataset.freq) || 262,
  badge: a.dataset.badge || '',
}));
const KEYS = ['a', 's', 'd', 'f', 'g'];
const EMBLEM_SRC = document.querySelector('.emblem-sm')?.src;

/* ------------------------------------------------------------------ sound */
const sound = (() => {
  let ctx, out, noise;
  let on = true;
  try { on = localStorage.getItem('mfa-sound') !== 'off'; } catch (e) { /* storage blocked */ }

  function ready() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      out = ctx.createDynamicsCompressor();
      out.threshold.value = -14;
      out.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.07);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // an open tone: fundamental + two inharmonic membrane partials + a bit of skin
  function hit(freq, vel = 1) {
    if (!on) return;
    const c = ready();
    if (!c) return;
    const t = c.currentTime + 0.005;
    for (const [ratio, amp, dur] of [[1, 0.8, 0.6], [1.59, 0.28, 0.28], [2.14, 0.14, 0.16]]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(freq * ratio * 1.3, t);
      o.frequency.exponentialRampToValueAtTime(freq * ratio, t + 0.035);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * vel, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    const n = c.createBufferSource();
    n.buffer = noise;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 8;
    bp.Q.value = 0.8;
    const ng = c.createGain();
    ng.gain.value = 0.45 * vel;
    n.connect(bp).connect(ng).connect(out);
    n.start(t);
  }

  return {
    hit,
    get on() { return on; },
    set on(v) {
      on = v;
      try { localStorage.setItem('mfa-sound', v ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
    },
  };
})();

if (soundBtn) {
  const paint = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.on));
    soundBtn.querySelector('.txt').textContent = sound.on ? 'Sound on' : 'Sound off';
  };
  paint();
  soundBtn.addEventListener('click', () => { sound.on = !sound.on; paint(); });
}

/* ------------------------------------------------------------------ renderer */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  renderer = null; // no WebGL: the plain link list stays as the menu
}

if (renderer) {
  // the drumhead stamp is drawn in EB Garamond, so give the webfont a moment to arrive
  const fonts = document.fonts
    ? Promise.race([document.fonts.load('500 30px "EB Garamond"'), new Promise((r) => setTimeout(r, 1500))])
    : Promise.resolve();
  fonts.then(init, init);
}

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  /* ---- light: one hard spot from above, one cold rim from behind ---- */
  const spot = new THREE.SpotLight(0xffffff, 260, 0, 0.5, 0.75, 2);
  spot.position.set(1.6, 9.5, 4.5);
  spot.target.position.set(0, 0.6, -0.4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0004;
  spot.shadow.normalBias = 0.02;
  spot.shadow.camera.near = 4;
  spot.shadow.camera.far = 20;
  scene.add(spot, spot.target);

  const rim = new THREE.DirectionalLight(0xffffff, 2.4);
  rim.position.set(-4, 5, -7);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-6, 2, 4);
  scene.add(rim, fill);

  /* ---- floor: invisible except for shadows and a soft pool of light ---- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.55 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  scene.add(floor);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  scene.add(pool);

  /* ---- materials ---- */
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: 0x0d0d0d, roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07,
    bumpMap: staveTexture(), bumpScale: 0.6,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 1, roughness: 0.18 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });

  const emblemTex = EMBLEM_SRC ? new THREE.TextureLoader().load(EMBLEM_SRC) : null;
  if (emblemTex) { emblemTex.colorSpace = THREE.SRGBColorSpace; emblemTex.anisotropy = 8; }

  /* ---- one conga ---- */
  const H = 2.0;
  const R_HEAD = 0.4;
  const profile = new THREE.SplineCurve([
    [0.33, 0], [0.37, 0.15], [0.43, 0.45], [0.474, 0.8], [0.485, 1.05],
    [0.466, 1.4], [0.432, 1.72], [0.407, 1.92], [0.4, 2.0],
  ].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(64);
  const shellR = (y) => {
    for (let i = 1; i < profile.length; i++) {
      if (profile[i].y >= y) {
        const a = profile[i - 1], b = profile[i];
        return a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y || 1));
      }
    }
    return profile[profile.length - 1].x;
  };
  const shellGeo = new THREE.LatheGeometry(profile, 96);
  const collarGeo = new THREE.CylinderGeometry(R_HEAD + 0.004, R_HEAD + 0.004, 0.05, 96, 1, true);
  const hoopGeo = new THREE.TorusGeometry(R_HEAD + 0.014, 0.019, 14, 96);
  const footGeo = new THREE.TorusGeometry(0.335, 0.02, 10, 72);
  const plateGeo = new THREE.BoxGeometry(0.065, 0.12, 0.026);
  const nutGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.03, 10);

  function makeDrum(i) {
    const g = new THREE.Group();

    const shell = new THREE.Mesh(shellGeo, lacquer);
    shell.castShadow = true;
    shell.receiveShadow = true;
    g.add(shell);

    const foot = new THREE.Mesh(footGeo, rubber);
    foot.rotation.x = Math.PI / 2;
    foot.position.y = 0.02;
    g.add(foot);

    const tex = headTexture(i);
    const skin = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, emissive: 0xffffff, emissiveIntensity: 0 });
    const headGeo = new THREE.RingGeometry(0, R_HEAD, 72, 18);
    const head = new THREE.Mesh(headGeo, skin);
    head.rotation.x = -Math.PI / 2;
    head.position.y = H + 0.004;
    head.receiveShadow = true;
    g.add(head);

    const collar = new THREE.Mesh(collarGeo, new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.85 }));
    collar.position.y = H - 0.02;
    g.add(collar);

    const hoop = new THREE.Mesh(hoopGeo, chrome);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = H - 0.03;
    hoop.castShadow = true;
    g.add(hoop);

    // six tuning lugs: hook from the hoop down to a plate on the shell
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      const ca = Math.cos(a), sa = Math.sin(a);
      const yTop = H - 0.035, yBot = H - 0.36;
      const rTop = R_HEAD + 0.03, rBot = shellR(yBot) + 0.03;
      const p1 = new THREE.Vector3(ca * rTop, yTop, sa * rTop);
      const p2 = new THREE.Vector3(ca * rBot, yBot, sa * rBot);
      const len = p1.distanceTo(p2);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 8), chrome);
      rod.position.copy(p1).add(p2).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      rod.castShadow = true;
      g.add(rod);

      const nut = new THREE.Mesh(nutGeo, chrome);
      nut.position.copy(p2);
      g.add(nut);

      const yP = yBot - 0.07;
      const rP = shellR(yP) + 0.01;
      const plate = new THREE.Mesh(plateGeo, chrome);
      plate.position.set(ca * rP, yP, sa * rP);
      plate.lookAt(ca * 10, yP, sa * 10);
      g.add(plate);
    }

    // a printed badge on the front of the shell, like a maker's logo (the 96 EYZ emblem on Music)
    if (DRUMS[i].badge === 'emblem' && emblemTex) {
      const yMid = 1.12, half = 0.27, pts = [];
      for (let k = 0; k <= 16; k++) {
        const y = yMid - half + (k / 16) * half * 2;
        pts.push(new THREE.Vector2(shellR(y) + 0.003, y));
      }
      const arc = (half * 2) / shellR(yMid);
      const badge = new THREE.Mesh(
        new THREE.LatheGeometry(pts, 24, -arc / 2, arc),
        new THREE.MeshStandardMaterial({
          map: emblemTex, transparent: true, depthWrite: false, roughness: 0.35, color: 0xe4e2dc,
          side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
        }),
      );
      g.add(badge);
    }

    // keep the flat head positions so ripples can be layered on top
    const pos = headGeo.attributes.position;
    const base = Float32Array.from(pos.array);

    g.userData = { i, head, skin, base, hitAt: -10, hitX: 0, hitY: 0, amp: 0, lift: 0, live: false };
    g.traverse((o) => { o.userData.drum = i; });
    return g;
  }

  const drums = DRUMS.map((d, i) => {
    const g = makeDrum(i);
    g.scale.setScalar(d.scale);
    scene.add(g);
    return g;
  });
  const pickables = drums.flatMap((g) => g.children);

  /* ---- layouts: an arc when wide, the five-spot of a die when tall ---- */
  const ARC = [-62, -31, 0, 31, 62].map((deg) => {
    const a = THREE.MathUtils.degToRad(deg), R = 2.4;
    return [R * Math.sin(a), -R + R * Math.cos(a)];
  });
  const DIE = [[-0.74, -0.92], [0.74, -0.92], [0, 0], [-0.74, 0.92], [0.74, 0.92]];

  const view = { target: new THREE.Vector3(), dist: 10, elev: 0.5, az: 0 };
  let tall = false;

  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    tall = aspect < 0.95;
    camera.aspect = aspect;
    camera.fov = tall ? 38 : 30;
    // looking steeply down, the lacquer mirrors the whole room; dim it so the shells stay black
    scene.environmentIntensity = tall ? 0.2 : 0.42;

    const spots = tall ? DIE : ARC;
    drums.forEach((g, i) => g.position.set(spots[i][0], 0, spots[i][1]));

    let cx = 0, cz = 0;
    spots.forEach(([x, z]) => { cx += x; cz += z; });
    cx /= spots.length; cz /= spots.length;

    // fit the set's width into the view
    const halfW = Math.max(...spots.map(([x]) => Math.abs(x - cx))) + 0.62;
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const margin = tall ? 1.04 : 1.14;
    const distW = (halfW * margin) / Math.tan(hHalf);
    const distH = 1.9 / Math.tan(vHalf);

    view.elev = THREE.MathUtils.degToRad(tall ? 54 : 33);
    view.dist = Math.max(distW, tall ? 0 : distH);
    // aim a little above the drums so the set sits low in the frame, under the masthead
    view.target.set(cx, tall ? 1.3 : 1.38, cz + (tall ? 0.1 : 0));

    const span = Math.max(halfW * 2.6, 6);
    pool.scale.set(span, span * (tall ? 1.1 : 0.7), 1);
    pool.position.set(cx, 0.001, cz - 0.2);

    camera.updateProjectionMatrix();
  }

  /* ---- camera ---- */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let intro = reduceMotion ? 1 : 0;
  const lookAt = new THREE.Vector3();
  let dive = null; // { from, to, fromLook, toLook, t0, href }

  function placeCamera(dt) {
    if (dive) return;
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
    const par = reduceMotion ? 0 : 1;
    const e = easeOut(intro);
    const dist = view.dist * (1 + 0.22 * (1 - e));
    const elev = view.elev + 0.12 * (1 - e) + pointer.sy * 0.04 * par;
    const az = pointer.sx * 0.08 * par;
    camera.position.set(
      view.target.x + Math.sin(az) * Math.cos(elev) * dist,
      view.target.y + Math.sin(elev) * dist,
      view.target.z + Math.cos(az) * Math.cos(elev) * dist,
    );
    lookAt.copy(view.target);
    camera.lookAt(lookAt);
  }

  /* ---- strike + ripple ---- */
  let now = 0;
  let last = performance.now();

  function strike(i, local, vel = 1) {
    const d = drums[i].userData;
    d.hitAt = now;
    d.amp = 0.028 * vel;
    d.hitX = local ? local.x : (Math.random() - 0.5) * 0.2;
    d.hitY = local ? local.y : 0.12 + Math.random() * 0.1;
    d.live = true;
    sound.hit(DRUMS[i].freq, vel);
    const a = links[i];
    if (a) {
      a.classList.add('struck');
      setTimeout(() => a.classList.remove('struck'), 160);
    }
  }

  function ripple(g) {
    const d = g.userData;
    const t = now - d.hitAt;
    const pos = d.head.geometry.attributes.position;
    const arr = pos.array;
    if (t > 1.6) {
      arr.set(d.base);
      pos.needsUpdate = true;
      d.head.geometry.computeVertexNormals();
      d.live = false;
      return;
    }
    const env = Math.exp(-3.2 * t);
    const wob = Math.cos(t * 2 * Math.PI * 7);
    for (let k = 0; k < arr.length; k += 3) {
      const x = d.base[k], y = d.base[k + 1];
      const r = Math.sqrt(x * x + y * y) / R_HEAD;
      const dx = (x - d.hitX) / R_HEAD, dy = (y - d.hitY) / R_HEAD;
      const rh = Math.sqrt(dx * dx + dy * dy);
      const edge = Math.max(0, 1 - r * r);
      const fundamental = edge * wob;
      const ring = Math.sin(26 * (rh - 1.5 * t)) * Math.exp(-2.4 * rh) * (rh < 1.5 * t + 0.05 ? 1 : 0);
      arr[k + 2] = d.amp * env * edge * (0.7 * fundamental + 0.6 * ring) - (rh < 0.25 ? d.amp * 0.4 * Math.exp(-14 * t) : 0);
    }
    pos.needsUpdate = true;
    d.head.geometry.computeVertexNormals();
  }

  /* ---- picking ---- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = -1;

  function pick(clientX, clientY) {
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (!hit) return null;
    const i = hit.object.userData.drum;
    const head = drums[i].userData.head;
    const local = head.worldToLocal(hit.point.clone());
    return { i, local: hit.object === head ? local : null };
  }

  function setHover(i) {
    if (hovered === i) return;
    hovered = i;
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    links.forEach((a, k) => a.classList.toggle('hot', k === i));
  }

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (e.pointerType === 'mouse') {
      const p = pick(e.clientX, e.clientY);
      setHover(p ? p.i : -1);
    }
  });
  canvas.addEventListener('pointerleave', () => setHover(-1));

  canvas.addEventListener('click', (e) => {
    const p = pick(e.clientX, e.clientY);
    if (!p) return;
    const href = links[p.i].getAttribute('href');
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      strike(p.i, p.local);
      window.open(href, '_blank', 'noopener');
      return;
    }
    go(p.i, p.local);
  });

  links.forEach((a, i) => {
    a.addEventListener('pointerenter', () => setHover(i));
    a.addEventListener('pointerleave', () => setHover(-1));
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(i, null);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0) strike(i, null, 0.9);
  });

  function go(i, local) {
    if (dive) return;
    strike(i, local);
    const href = links[i].getAttribute('href');
    if (reduceMotion) {
      window.location.href = href;
      return;
    }
    const g = drums[i];
    const s = DRUMS[i].scale;
    const headPos = new THREE.Vector3(0, H, 0);
    g.localToWorld(headPos);
    body.classList.add('diving');
    dive = {
      from: camera.position.clone(),
      fromLook: lookAt.clone(),
      to: headPos.clone().add(new THREE.Vector3(0, 0.55 * s, 0.02)),
      toLook: headPos,
      t0: performance.now() + 120, // wall clock, so slow devices still finish the dive in time
      href,
    };
    // the writing room is a white page: dive through the cream drumhead into paper, not black
    curtain.classList.toggle('paper', links[i].hasAttribute('data-paper'));
    setTimeout(() => curtain.classList.add('down'), 520);
    setTimeout(() => { window.location.href = href; }, 860);
  }

  // coming back with the browser's back button: lift the curtain and reset the camera
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    dive = null;
    curtain.classList.remove('down');
    body.classList.remove('diving');
  });

  /* ---- labels follow the drumheads ---- */
  const v = new THREE.Vector3();
  const right = new THREE.Vector3();
  function placeLabels() {
    const w = window.innerWidth, h = window.innerHeight;
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    links.forEach((a, i) => {
      const g = drums[i];
      const s = DRUMS[i].scale;
      v.set(0, H, 0);
      g.localToWorld(v);
      const c = v.clone().project(camera);
      const edge = v.clone().addScaledVector(right, R_HEAD * s).project(camera);
      const x = (c.x * 0.5 + 0.5) * w;
      const y = (-c.y * 0.5 + 0.5) * h;
      const headPx = Math.abs(edge.x - c.x) * w; // radius on screen
      // how squashed the ellipse is from this angle
      const up = v.clone().add(new THREE.Vector3(0, 0, -R_HEAD * s)).project(camera);
      const squash = Math.min(1, (Math.abs(up.y - c.y) * h) / Math.max(1, headPx));
      a.style.setProperty('--x', `${x.toFixed(1)}px`);
      a.style.setProperty('--y', `${y.toFixed(1)}px`);
      a.style.setProperty('--fs', `${Math.max(11, Math.min(30, headPx * 0.3)).toFixed(1)}px`);
      a.style.setProperty('--sy', (0.62 + 0.38 * squash).toFixed(3));
    });
  }

  /* ---- loop ---- */
  layout();
  window.addEventListener('resize', layout);

  const introStart = performance.now();
  if (!reduceMotion) {
    // a quiet roll across the set as it comes up (visual only; audio waits for a real hit)
    drums.forEach((g, i) => setTimeout(() => {
      const d = g.userData;
      d.hitAt = now; d.amp = 0.016; d.hitX = 0; d.hitY = 0.1; d.live = true;
    }, 500 + i * 130));
  }

  renderer.setAnimationLoop(() => {
    const t = performance.now();
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    now += dt;
    if (!reduceMotion) intro = Math.min(1, (performance.now() - introStart) / 2400);

    drums.forEach((g, i) => {
      const d = g.userData;
      const target = hovered === i && !dive ? 1 : 0;
      d.lift += (target - d.lift) * Math.min(1, dt * 10);
      g.position.y = d.lift * 0.05;
      d.skin.emissiveIntensity = d.lift * 0.07;
      if (d.live) ripple(g);
    });

    if (dive) {
      const k = Math.min(1, Math.max(0, (performance.now() - dive.t0) / 700));
      const e = easeInOut(k);
      camera.position.lerpVectors(dive.from, dive.to, e);
      lookAt.lerpVectors(dive.fromLook, dive.toLook, e);
      camera.lookAt(lookAt);
    } else {
      placeCamera(dt);
    }

    camera.updateMatrixWorld();
    placeLabels();
    renderer.render(scene, camera);
  });

  body.classList.add('is-3d');
  if (soundBtn) soundBtn.hidden = false; // only worth offering once there are drums to hear
  setTimeout(() => body.classList.add('labels-on'), reduceMotion ? 0 : 1100);
}

/* ------------------------------------------------------------------ textures */
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// rawhide: warm-neutral, fibrous, darker where hands land, maker's ring stamped near the rim
function headTexture(seed) {
  const rnd = mulberry(seed * 9973 + 17);
  return canvasTex(1024, (ctx, S) => {
    const C = S / 2;
    const g = ctx.createRadialGradient(C, C, 0, C, C, C);
    g.addColorStop(0, '#ebe7df');
    g.addColorStop(0.75, '#e2ddd2');
    g.addColorStop(1, '#c9c1b2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    // fibres
    for (let k = 0; k < 2600; k++) {
      const x = rnd() * S, y = rnd() * S, len = 6 + rnd() * 40, a = rnd() * Math.PI;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(90,80,64,0.05)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1 + rnd() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    // mottling
    for (let k = 0; k < 90; k++) {
      const x = rnd() * S, y = rnd() * S, r = 20 + rnd() * 110;
      const m = ctx.createRadialGradient(x, y, 0, x, y, r);
      m.addColorStop(0, `rgba(110,96,74,${0.03 + rnd() * 0.05})`);
      m.addColorStop(1, 'rgba(110,96,74,0)');
      ctx.fillStyle = m;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // wear where the player's hands land (far side, toward the top of the texture)
    for (const [px, py, pr, pa] of [[0.5, 0.3, 0.32, 0.16], [0.5, 0.5, 0.22, 0.08], [0.36, 0.26, 0.12, 0.1], [0.64, 0.27, 0.12, 0.1]]) {
      const m = ctx.createRadialGradient(px * S, py * S, 0, px * S, py * S, pr * S);
      m.addColorStop(0, `rgba(84,70,50,${pa})`);
      m.addColorStop(1, 'rgba(84,70,50,0)');
      ctx.fillStyle = m;
      ctx.fillRect(0, 0, S, S);
    }
    // tuck where the skin bends over the rim
    ctx.strokeStyle = 'rgba(70,58,40,0.28)';
    ctx.lineWidth = S * 0.035;
    ctx.beginPath();
    ctx.arc(C, C, C * 0.975, 0, Math.PI * 2);
    ctx.stroke();

    // maker's stamp around the edge
    ctx.save();
    ctx.translate(C, C);
    ctx.fillStyle = 'rgba(28,24,20,0.5)';
    ctx.font = `500 ${S * 0.03}px "EB Garamond", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = 'MAWON  ·  FREEDOM  ·  ARTS  ·  ';
    const rad = C * 0.84;
    const arc = Math.PI * 0.9;
    for (let k = 0; k < text.length; k++) {
      const a = Math.PI / 2 + arc / 2 - (k / (text.length - 1)) * arc;
      ctx.save();
      ctx.rotate(-a + Math.PI / 2);
      ctx.translate(0, -rad);
      ctx.fillText(text[k], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  });
}

// vertical stave seams for the shell's bump map
function staveTexture() {
  const t = canvasTex(512, (ctx, S) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, S, S);
    const staves = 18;
    for (let k = 0; k < staves; k++) {
      const x = (k / staves) * S;
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x, 0, 1.5, S);
    }
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function poolTexture() {
  return canvasTex(512, (ctx, S) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.11)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });
}

/* ------------------------------------------------------------------ utils */
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
