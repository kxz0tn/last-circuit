/* Orrery. Y-up, orbits in XZ, angle 0 on +X.
   Camera theta 0, phi = pi/2 sits on +Z so world +X is screen right. */
(function (root) {
  'use strict';

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
  var ANGLE = {
    mercury: 0.4, venus: 1.15, earth: 2.05, moon: 2.55, mars: 2.75,
    jupiter: 3.55, saturn: 4.35, uranus: 5.15, neptune: 0.35, pluto: 1.05
  };

  function orbitRadius(au, mode) {
    var a = Math.abs(Number(au) || 0);
    if (mode === 'honest') return a * 10;
    return 3.2 + Math.pow(Math.max(a, 0.02), 0.36) * 6.2;
  }

  function visualRadius(body, mode) {
    if (!body || body.id === 'belt') return 0.2;
    var km = body.radius_km || 1800;
    if (mode === 'honest') {
      if (body.id === 'sun') return 1.15;
      return Math.max(0.42, (km / 696000) * 8);
    }
    if (body.id === 'sun') return 3.1;
    return 0.62 + Math.pow(km / 696000, 0.34) * 2.5;
  }

  function worldPos(body, mode) {
    if (!body || body.id === 'sun') return { x: 0, y: 0, z: 0 };
    if (body.id === 'belt') return null;
    var au = body.id === 'moon' ? 1 : body.au;
    if (au == null) return { x: 0, y: 0, z: 0 };
    var radius = orbitRadius(au, mode);
    if (body.id === 'moon') radius += mode === 'honest' ? 0.9 : 1.7;
    var ang = ANGLE[body.id] || 0;
    return { x: Math.cos(ang) * radius, y: 0, z: Math.sin(ang) * radius };
  }

  function cameraOffset(dist, phi, theta) {
    return {
      x: dist * Math.sin(phi) * Math.sin(theta),
      y: dist * Math.cos(phi),
      z: dist * Math.sin(phi) * Math.cos(theta)
    };
  }

  function hash(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function schematicSvg(bodies, mode) {
    var maxR = 8;
    bodies.forEach(function (b) {
      if (!b.au || b.id === 'sun') return;
      var p = worldPos(b, mode);
      if (p) maxR = Math.max(maxR, Math.hypot(p.x, p.z));
    });
    var scale = 340 / maxR;
    var parts = ['<svg class="schematic" viewBox="0 0 800 800" role="img" aria-label="Top-down plan. Select a world from the list.">'];
    parts.push('<rect width="800" height="800" fill="#000"/>');
    parts.push('<text x="24" y="32" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">PLAN · +X RIGHT · +Z DOWN</text>');
    bodies.forEach(function (b) {
      if (!b.au || b.id === 'sun' || b.id === 'moon' || b.id === 'belt') return;
      var r = orbitRadius(b.au, mode) * scale;
      parts.push('<circle cx="400" cy="400" r="' + r.toFixed(1) + '" fill="none" stroke="#2a2a2a"/>');
    });
    var inner = orbitRadius(2.2, mode) * scale;
    var outer = orbitRadius(3.2, mode) * scale;
    var i;
    for (i = 0; i < 36; i++) {
      var rr = inner + hash(i) * (outer - inner);
      var ang = hash(i + 9) * Math.PI * 2;
      parts.push('<rect x="' + (400 + Math.cos(ang) * rr - 1).toFixed(1) + '" y="' + (400 + Math.sin(ang) * rr - 1).toFixed(1) + '" width="2" height="2" fill="#8d8d8d"/>');
    }
    bodies.forEach(function (b) {
      if (b.id === 'belt' || b.id === 'sun') return;
      var pos = worldPos(b, mode);
      var x = 400 + pos.x * scale;
      var y = 400 + pos.z * scale;
      var rad = Math.max(4, Math.min(18, visualRadius(b, mode) * scale * 0.35));
      var show = mode !== 'honest' || b.id === 'earth' || b.id === 'jupiter' || b.id === 'saturn' || b.id === 'neptune' || b.id === 'pluto';
      parts.push('<g data-go="solar/' + b.id + '" tabindex="0" role="link" aria-label="' + esc(b.title) + '">');
      parts.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16" fill="transparent"/>');
      parts.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rad.toFixed(1) + '" fill="#0b0b0b" stroke="#ececec"/>');
      if (show) parts.push('<text x="' + (x + rad + 6).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" fill="#8d8d8d" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">' + esc(b.title.toUpperCase()) + '</text>');
      parts.push('</g>');
    });
    parts.push('<g data-go="solar/sun" tabindex="0" role="link" aria-label="Sun"><circle cx="400" cy="400" r="18" fill="transparent"/><circle cx="400" cy="400" r="' + (mode === 'honest' ? 5 : 14) + '" fill="#f3f3f3"/><text x="420" y="396" fill="#ececec" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">SUN</text></g>');
    parts.push('</svg>');
    return parts.join('');
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); })
    ]);
  }

  async function mount(container, opts) {
    if (!container || !root.LCViz.hasWebGL()) return null;
    var THREE;
    try { THREE = await withTimeout(import(THREE_URL), 8000); } catch (err) { return null; }
    if (!container.isConnected) return null;
    var bodies = (opts.bodies || []).filter(function (b) { return b.id !== 'belt'; });
    var mode = opts.mode === 'honest' ? 'honest' : 'readable';
    var mobile = !!opts.mobile || root.matchMedia('(max-width: 700px)').matches;
    var reduce = !!opts.reduce;
    var onSelect = opts.onSelect || function () {};
    var segW = mobile ? 24 : 48;
    var segH = mobile ? 16 : 32;

    var canvas = document.createElement('canvas');
    canvas.className = 'solar-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var labelLayer = document.createElement('div');
    labelLayer.className = 'solar-labels';
    var bracket = document.createElement('div');
    bracket.className = 'hud-bracket';
    bracket.hidden = true;
    labelLayer.appendChild(bracket);
    container.innerHTML = '';
    container.appendChild(canvas);
    container.appendChild(labelLayer);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
    } catch (err) { return null; }
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    root.LCViz.tone(renderer, THREE);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 90, 520);
    var camera = new THREE.PerspectiveCamera(42, 1, 0.08, 2000);
    camera.up.set(0, 1, 0);
    scene.add(new THREE.HemisphereLight(0x6e6e6e, 0x080808, 0.38));
    var key = new THREE.PointLight(0xffffff, 70, 0, 0.55);
    scene.add(key);

    var phi = 1.02;
    var theta = 0.2;
    var dist = 28;
    var alive = true;
    var frameOk = false;
    var hoverId = null;
    var dragging = false;
    var moved = 0;
    var lastX = 0;
    var lastY = 0;
    var pointers = {};
    var pinch = 0;
    var scratch = new THREE.Vector3();
    var scratch2 = new THREE.Vector3();
    var items = [];

    function placeCamera() {
      var p = cameraOffset(dist, phi, theta);
      camera.position.set(p.x, p.y, p.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    }

    function defaultDist(nextMode) {
      var maxR = nextMode === 'honest' ? orbitRadius(5.2, 'honest') : orbitRadius(19.2, 'readable');
      return maxR / Math.tan(THREE.MathUtils.degToRad(21)) * (nextMode === 'honest' ? 1.22 : 1.05);
    }

    function zoomLimits() {
      return mode === 'honest' ? { min: 6, max: 900 } : { min: 14, max: 220 };
    }

    var orbitMat = new THREE.LineBasicMaterial({ color: 0x3a3a3a });
    var gridMat = new THREE.LineBasicMaterial({ color: 0x2a2a2a });

    function makeOrbit(au) {
      var r = orbitRadius(au, mode);
      var pts = [];
      var steps = mobile ? 64 : 128;
      for (var i = 0; i <= steps; i++) {
        var a = (i / steps) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      var line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), orbitMat);
      line.name = 'orbit';
      return line;
    }

    function rebuildOrbits() {
      scene.children.slice().forEach(function (child) {
        if (child.name === 'orbit' || child.name === 'ecliptic') {
          scene.remove(child);
          if (child.geometry) child.geometry.dispose();
        }
      });
      if (!mobile) {
        var grid = new THREE.Group();
        grid.name = 'ecliptic';
        var limit = mode === 'honest' ? orbitRadius(5.2, mode) : orbitRadius(30, mode);
        [0.33, 0.66, 1].forEach(function (t) {
          var pts = [];
          var s;
          for (s = 0; s <= 80; s++) {
            var a = (s / 80) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a) * limit * t, 0, Math.sin(a) * limit * t));
          }
          grid.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
        });
        scene.add(grid);
      }
      bodies.forEach(function (body) {
        if (body.id !== 'sun' && body.id !== 'moon' && body.au) scene.add(makeOrbit(body.au));
      });
    }

    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: root.LCViz.haloTexture(THREE),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    halo.scale.set(7, 7, 1);
    scene.add(halo);

    bodies.forEach(function (body) {
      var geo = new THREE.SphereGeometry(1, segW, segH);
      var mesh = new THREE.Mesh(geo, root.LCViz.planetMaterial(THREE, body.id, mobile));
      mesh.scale.setScalar(visualRadius(body, mode));
      var pos = worldPos(body, mode);
      mesh.position.set(pos.x, pos.y, pos.z);
      if (body.id === 'saturn') {
        var ring = new THREE.Mesh(
          new THREE.RingGeometry(1.35, 2.25, mobile ? 48 : 96),
          new THREE.MeshStandardMaterial({
            map: root.LCViz.ringTexture(THREE, mobile),
            transparent: true,
            roughness: 0.9,
            metalness: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        ring.rotation.x = -Math.PI / 2 + 0.42;
        mesh.add(ring);
      }
      scene.add(mesh);
      var lab = document.createElement('button');
      lab.type = 'button';
      lab.className = 'solar-label';
      lab.textContent = body.title.toUpperCase();
      lab.dataset.go = 'solar/' + body.id;
      labelLayer.appendChild(lab);
      items.push({ body: body, mesh: mesh, label: lab });
    });

    var beltCount = mobile ? 50 : 110;
    var beltPos = new Float32Array(beltCount * 3);
    function fillBelt() {
      var i;
      for (i = 0; i < beltCount; i++) {
        var au = 2.2 + hash(i) * 1.05;
        var ang = hash(i + 4) * Math.PI * 2;
        var r = orbitRadius(au, mode);
        beltPos[i * 3] = Math.cos(ang) * r;
        beltPos[i * 3 + 1] = (hash(i + 2) - 0.5) * 0.08;
        beltPos[i * 3 + 2] = Math.sin(ang) * r;
      }
    }
    fillBelt();
    var beltGeo = new THREE.BufferGeometry();
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3));
    var belt = new THREE.Points(beltGeo, new THREE.PointsMaterial({ color: 0x8d8d8d, size: 1.4, sizeAttenuation: false }));
    scene.add(belt);
    rebuildOrbits();

    function resize() {
      var w = container.clientWidth || 320;
      var h = container.clientHeight || 240;
      renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }

    function layout(next) {
      mode = next === 'honest' ? 'honest' : 'readable';
      items.forEach(function (item) {
        var pos = worldPos(item.body, mode);
        item.mesh.position.set(pos.x, pos.y, pos.z);
        item.mesh.scale.setScalar(visualRadius(item.body, mode));
      });
      halo.scale.set(mode === 'honest' ? 3.2 : 7, mode === 'honest' ? 3.2 : 7, 1);
      fillBelt();
      beltGeo.attributes.position.needsUpdate = true;
      rebuildOrbits();
      dist = defaultDist(mode);
      var limits = zoomLimits();
      dist = Math.max(limits.min, Math.min(limits.max, dist));
      placeCamera();
    }

    function projectWorld(x, y, z) {
      scratch.set(x, y, z).project(camera);
      return { x: scratch.x, y: scratch.y, z: scratch.z };
    }

    function runFrameProbe() {
      var saved = { phi: phi, theta: theta, dist: dist };
      phi = Math.PI / 2;
      theta = 0;
      dist = 10;
      placeCamera();
      camera.updateMatrixWorld(true);
      var right = projectWorld(1, 0, 0);
      var up = projectWorld(0, 1, 0);
      var pose = cameraOffset(10, Math.PI / 2, 0);
      frameOk = Math.abs(pose.x) < 1e-6 && Math.abs(pose.y) < 1e-6 && Math.abs(pose.z - 10) < 1e-6 && right.x > 0.05 && up.y > 0.05;
      phi = saved.phi;
      theta = saved.theta;
      dist = saved.dist;
      placeCamera();
    }

    function nudge(dx, dy) {
      var h = Math.max(container.clientHeight || 300, 1);
      theta -= (2 * Math.PI * dx) / h;
      phi = Math.max(0.18, Math.min(Math.PI - 0.18, phi - (2 * Math.PI * dy) / h));
      placeCamera();
    }

    function pick(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var x = clientX - rect.left;
      var y = clientY - rect.top;
      var best = null;
      var bestD = mobile ? 36 : 26;
      items.forEach(function (item) {
        var v = projectWorld(item.mesh.position.x, item.mesh.position.y, item.mesh.position.z);
        camera.getWorldDirection(scratch2);
        scratch.set(item.mesh.position.x, item.mesh.position.y, item.mesh.position.z).sub(camera.position);
        if (scratch.dot(scratch2) <= 0) return;
        var sx = (v.x * 0.5 + 0.5) * rect.width;
        var sy = (-v.y * 0.5 + 0.5) * rect.height;
        var d = Math.hypot(sx - x, sy - y);
        if (d < bestD) { bestD = d; best = item.body.id; }
      });
      return best;
    }

    function paintLabels() {
      var rect = canvas.getBoundingClientRect();
      camera.getWorldDirection(scratch2);
      var hit = false;
      var placed = [];
      items.forEach(function (item) {
        var pos = item.mesh.position;
        scratch.set(pos.x, pos.y, pos.z).sub(camera.position);
        var facing = scratch.dot(scratch2) > 0;
        var v = projectWorld(pos.x, pos.y, pos.z);
        if (!facing) { item.label.hidden = true; return; }
        var sx = (v.x * 0.5 + 0.5) * rect.width;
        var sy = (-v.y * 0.5 + 0.5) * rect.height;
        var crowded = false;
        var p;
        for (p = 0; p < placed.length; p++) {
          if (Math.hypot(placed[p].x - sx, placed[p].y - sy) < 26) crowded = true;
        }
        var hot = item.body.id === hoverId;
        item.label.hidden = crowded && !hot;
        if (!item.label.hidden) placed.push({ x: sx, y: sy });
        item.label.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + (sy - 18).toFixed(1) + 'px)';
        item.label.classList.toggle('is-hot', item.body.id === hoverId);
        if (item.body.id === hoverId) {
          hit = true;
          bracket.hidden = false;
          bracket.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px) translate(-50%, -50%)';
        }
      });
      if (!hit) bracket.hidden = true;
    }

    function loop() {
      if (!alive || document.hidden) return;
      renderer.render(scene, camera);
      paintLabels();
      root.requestAnimationFrame(loop);
    }
    function onVis() { if (!document.hidden && alive) root.requestAnimationFrame(loop); }

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) {
          var limits = zoomLimits();
          dist = Math.max(limits.min, Math.min(limits.max, dist * (pinch / d)));
          placeCamera();
        }
        pinch = d;
        return;
      }
      if (!dragging) { hoverId = pick(e.clientX, e.clientY); return; }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX; lastY = e.clientY;
      nudge(dx, dy);
    });
    function endPointer(e) {
      var wasDrag = moved > 6;
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch = 0;
      if (!Object.keys(pointers).length) {
        dragging = false;
        if (!wasDrag && e.type === 'pointerup') {
          var id = pick(e.clientX, e.clientY);
          if (id) onSelect(id);
        }
        moved = 0;
      }
    }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var limits = zoomLimits();
      dist = Math.max(limits.min, Math.min(limits.max, dist * Math.exp(e.deltaY * 0.001)));
      placeCamera();
    }, { passive: false });

    var observer = new ResizeObserver(resize);
    observer.observe(container);
    document.addEventListener('visibilitychange', onVis);
    dist = defaultDist(mode);
    placeCamera();
    resize();
    runFrameProbe();
    root.requestAnimationFrame(loop);

    return {
      frameOk: frameOk,
      setMode: function (next) { layout(next); },
      resize: resize,
      nudge: nudge,
      projectWorld: projectWorld,
      cameraPosition: function () { return { x: camera.position.x, y: camera.position.y, z: camera.position.z }; },
      destroy: function () {
        alive = false;
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVis);
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
          if (m.bumpMap) m.bumpMap.dispose();
          m.dispose();
        });
        renderer.dispose();
        if (container) container.innerHTML = '';
      }
    };
  }

  root.LCSolar = {
    orbitRadius: orbitRadius,
    worldPos: worldPos,
    cameraOffset: cameraOffset,
    visualRadius: visualRadius,
    schematicSvg: schematicSvg,
    mount: mount,
    hasWebGL: function () { return root.LCViz.hasWebGL(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
