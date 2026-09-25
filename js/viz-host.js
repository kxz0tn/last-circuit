/* One WebGL context for the terminal. Scenes borrow it and give it back. */
(function (root) {
  'use strict';

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
  var loading = null;
  var active = null;
  var seq = 0;

  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (err) {
      return false;
    }
  }

  function loadThree() {
    if (!loading) {
      loading = Promise.race([
        import(THREE_URL),
        new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error('timeout')); }, 8000);
        })
      ]).catch(function (err) {
        loading = null;
        throw err;
      });
    }
    return loading;
  }

  function bindOrbit(api, opts) {
    var THREE = api.THREE;
    var theta = opts.theta == null ? 0.35 : opts.theta;
    var phi = opts.phi == null ? 1.05 : opts.phi;
    var dist = opts.dist == null ? 6 : opts.dist;
    var min = opts.min == null ? 2 : opts.min;
    var max = opts.max == null ? 40 : opts.max;
    var target = opts.target || new THREE.Vector3();
    var dragging = false;
    var moved = 0;
    var lastX = 0;
    var lastY = 0;
    var pointers = {};
    var pinch = 0;
    var canvas = api.canvas;

    function place() {
      var x = dist * Math.sin(phi) * Math.sin(theta);
      var y = dist * Math.cos(phi);
      var z = dist * Math.sin(phi) * Math.cos(theta);
      api.camera.position.set(target.x + x, target.y + y, target.z + z);
      api.camera.up.set(0, 1, 0);
      api.camera.lookAt(target);
    }

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var a = pointers[ids[0]];
        var b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) dist = Math.max(min, Math.min(max, dist * (pinch / d)));
        pinch = d;
        place();
        return;
      }
      if (!dragging) return;
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      var h = Math.max(canvas.clientHeight || 300, 1);
      theta -= (2 * Math.PI * dx) / h;
      phi -= (2 * Math.PI * dy) / h;
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi));
      place();
    });
    function endPointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch = 0;
      if (!Object.keys(pointers).length) dragging = false;
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      dist = Math.max(min, Math.min(max, dist * Math.exp(e.deltaY * 0.0012)));
      place();
    }, { passive: false });
    place();
    return { place: place };
  }

  async function open(container, opts, build) {
    opts = opts || {};
    var ticket = ++seq;
    if (active && active.destroy) active.destroy();
    active = null;
    if (!container || !hasWebGL()) return null;
    var THREE;
    try { THREE = await loadThree(); } catch (err) { return null; }
    if (ticket !== seq || !container.isConnected) return null;
    var mobile = opts.mobile != null ? opts.mobile : root.matchMedia('(max-width: 700px)').matches;
    var reduce = opts.reduce != null ? opts.reduce : root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canvas = document.createElement('canvas');
    canvas.className = 'solar-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !mobile,
        alpha: false,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      return null;
    }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    tone(renderer, THREE);
    container.innerHTML = '';
    container.appendChild(canvas);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.05, 800);
    camera.up.set(0, 1, 0);
    var alive = true;

    function resize() {
      var w = container.clientWidth || 320;
      var h = container.clientHeight || 220;
      renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }

    var api = { THREE: THREE, scene: scene, camera: camera, renderer: renderer, canvas: canvas, mobile: mobile, reduce: reduce, resize: resize };
    var extra = {};
    try {
      extra = build(api) || {};
    } catch (err) {
      renderer.dispose();
      container.innerHTML = '';
      return null;
    }

    function loop() {
      if (!alive || document.hidden) return;
      if (extra.frame) extra.frame(api.reduce);
      renderer.render(scene, camera);
      root.requestAnimationFrame(loop);
    }
    function onVis() {
      if (!document.hidden && alive) root.requestAnimationFrame(loop);
    }
    var observer = new ResizeObserver(resize);
    observer.observe(container);
    document.addEventListener('visibilitychange', onVis);
    resize();
    if (extra.ready) extra.ready();
    renderer.render(scene, camera);
    root.requestAnimationFrame(loop);

    var handle = {
      resize: resize,
      frame: function () { renderer.render(scene, camera); }
    };
    Object.keys(extra).forEach(function (key) {
      if (key !== 'frame' && key !== 'ready' && key !== 'dispose') handle[key] = extra[key];
    });
    handle.destroy = function () {
      if (!alive) return;
      alive = false;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      if (extra.dispose) extra.dispose();
      var mats = new Set();
      scene.traverse(function (node) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          var list = Array.isArray(node.material) ? node.material : [node.material];
          list.forEach(function (m) { mats.add(m); });
        }
      });
      mats.forEach(function (m) {
        if (m.map) m.map.dispose();
        m.dispose();
      });
      renderer.dispose();
      if (container) container.innerHTML = '';
      if (active === handle) active = null;
    };
    active = handle;
    return handle;
  }

  function hash2(ix, iy) {
    var n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function noise(x, y) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var fx = x - x0;
    var fy = y - y0;
    var ux = fx * fx * (3 - 2 * fx);
    var uy = fy * fy * (3 - 2 * fy);
    var a = hash2(x0, y0);
    var b = hash2(x0 + 1, y0);
    var c = hash2(x0, y0 + 1);
    var d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm(x, y) {
    var v = 0;
    var a = 0.55;
    var f = 1;
    var i;
    for (i = 0; i < 4; i++) {
      v += a * noise(x * f, y * f);
      f *= 2;
      a *= 0.5;
    }
    return v;
  }

  function kindOf(id) {
    if (id === 'jupiter' || id === 'saturn') return 'gas';
    if (id === 'uranus' || id === 'neptune') return 'ice';
    if (id === 'venus') return 'cloud';
    return 'rock';
  }

  function paintSphere(kind, w, h) {
    var color = document.createElement('canvas');
    var bump = document.createElement('canvas');
    color.width = bump.width = w;
    color.height = bump.height = h;
    var ic = color.getContext('2d').createImageData(w, h);
    var ib = bump.getContext('2d').createImageData(w, h);
    var y, x, u, lon, lat, n, shade, height, i, band, crater;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        u = x / w;
        lon = u * Math.PI * 2;
        lat = (y / h - 0.5) * Math.PI;
        n = fbm(lon * 0.9 + kind.length, lat * 0.9);
        if (kind === 'gas') {
          band = Math.sin(lat * 10 + n);
          shade = 118 + band * 48 + n * 16;
          height = 128 + band * 24;
        } else if (kind === 'ice') {
          shade = 170 + n * 34;
          height = 140 + n * 40;
        } else if (kind === 'cloud') {
          shade = 198 + n * 22;
          height = 150 + n * 16;
        } else {
          crater = fbm(lon * 2.6, lat * 2.6);
          shade = 92 + n * 78;
          height = 96 + n * 110;
          if (crater > 0.64) {
            shade *= 0.7;
            height *= 0.78;
          }
        }
        shade = Math.max(0, Math.min(255, shade));
        height = Math.max(0, Math.min(255, height));
        i = (y * w + x) * 4;
        ic.data[i] = ic.data[i + 1] = ic.data[i + 2] = shade;
        ic.data[i + 3] = 255;
        ib.data[i] = ib.data[i + 1] = ib.data[i + 2] = height;
        ib.data[i + 3] = 255;
      }
    }
    color.getContext('2d').putImageData(ic, 0, 0);
    bump.getContext('2d').putImageData(ib, 0, 0);
    return { color: color, bump: bump };
  }

  function surface(THREE, id, mobile) {
    var w = mobile ? 128 : 256;
    var h = mobile ? 64 : 128;
    var painted = paintSphere(kindOf(id), w, h);
    var map = new THREE.CanvasTexture(painted.color);
    var bumpMap = new THREE.CanvasTexture(painted.bump);
    if (THREE.SRGBColorSpace) map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return { map: map, bumpMap: bumpMap };
  }

  function planetMaterial(THREE, id, mobile) {
    if (id === 'sun') {
      return new THREE.MeshStandardMaterial({
        color: 0xf3f3f3,
        emissive: 0xf3f3f3,
        emissiveIntensity: 1.35,
        roughness: 0.4,
        metalness: 0
      });
    }
    var maps = surface(THREE, id, mobile);
    var gas = id === 'jupiter' || id === 'saturn';
    return new THREE.MeshStandardMaterial({
      map: maps.map,
      bumpMap: maps.bumpMap,
      bumpScale: gas ? 0.015 : 0.07,
      roughness: id === 'venus' ? 0.96 : 0.84,
      metalness: 0.02
    });
  }

  function ringTexture(THREE, mobile) {
    var w = mobile ? 128 : 256;
    var h = 32;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var img = c.getContext('2d').createImageData(w, h);
    var y, x, v, gap, alpha, shade, i;
    for (y = 0; y < h; y++) {
      v = y / h;
      gap = (v > 0.58 && v < 0.66) ? 0.05 : 1;
      alpha = Math.sin(v * Math.PI) * gap * (0.45 + 0.55 * Math.abs(Math.sin(v * 28)));
      shade = 150 + Math.floor(70 * Math.abs(Math.sin(v * 18)));
      for (x = 0; x < w; x++) {
        i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = shade;
        img.data[i + 3] = Math.floor(Math.max(0, Math.min(1, alpha)) * 220);
      }
    }
    c.getContext('2d').putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function diskTexture(THREE) {
    var w = 8;
    var h = 64;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var img = c.getContext('2d').createImageData(w, h);
    var y, x, v, alpha, shade, i;
    for (y = 0; y < h; y++) {
      v = y / (h - 1);
      alpha = Math.sin(v * Math.PI);
      alpha = alpha * alpha * (0.35 + 0.65 * (1 - v));
      shade = Math.floor(210 - v * 90);
      for (x = 0; x < w; x++) {
        i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = shade;
        img.data[i + 3] = Math.floor(Math.max(0, Math.min(1, alpha)) * 230);
      }
    }
    c.getContext('2d').putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  function haloTexture(THREE) {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.2, 'rgba(255,255,255,0.28)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function tone(renderer, THREE) {
    if (THREE.ACESFilmicToneMapping != null) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  root.LCViz = {
    hasWebGL: hasWebGL,
    loadThree: loadThree,
    open: open,
    bindOrbit: bindOrbit,
    planetMaterial: planetMaterial,
    ringTexture: ringTexture,
    diskTexture: diskTexture,
    haloTexture: haloTexture,
    tone: tone,
    failNote: 'serve via http:// for 3D'
  };
})(typeof window !== 'undefined' ? window : globalThis);
