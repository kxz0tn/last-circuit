/* Nested rings. The scrubber moves the camera. The plate holds the number. */
(function (root) {
  'use strict';

  function fallback() {
    return '<svg class="graph" viewBox="0 0 640 200" role="img" aria-label="Nested scale rings"><rect width="640" height="200" fill="#000"/><circle cx="120" cy="100" r="16" fill="none" stroke="#ececec"/><circle cx="210" cy="100" r="28" fill="none" stroke="#c8c8c8"/><circle cx="320" cy="100" r="42" fill="none" stroke="#8d8d8d"/><circle cx="470" cy="100" r="64" fill="none" stroke="#2a2a2a"/><text x="20" y="28" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">SCALE WELL</text></svg>';
  }

  async function mount(container, opts) {
    var stops = opts.stops || [];
    var rings = [];
    var handle = await root.LCViz.open(container, opts, function (api) {
      var THREE = api.THREE;
      var seg = api.mobile ? 40 : 72;
      api.scene.fog = new THREE.Fog(0x050505, 12, 90);
      stops.forEach(function (stop, index) {
        var z = 4 + stop.t * 70;
        var radius = 1.1 + index * 0.28;
        var pts = [];
        var s;
        for (s = 0; s <= seg; s++) {
          var a = (s / seg) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 0.62, z));
        }
        var loop = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x8d8d8d })
        );
        api.scene.add(loop);
        var tick = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(radius, 0, z),
            new THREE.Vector3(radius + 0.18, 0, z)
          ]),
          new THREE.LineBasicMaterial({ color: 0xf3f3f3 })
        );
        api.scene.add(tick);
        rings.push(loop);
      });
      api.camera.near = 0.05;
      api.camera.far = 160;
      function setT(t) {
        var z = 1.2 + Math.max(0, Math.min(1, t)) * 70;
        api.camera.position.set(0, 0.35, z);
        api.camera.up.set(0, 1, 0);
        api.camera.lookAt(0, 0, z + 8);
        var nearest = 0;
        var best = 99;
        stops.forEach(function (stop, i) {
          var d = Math.abs(stop.t - t);
          if (d < best) { best = d; nearest = i; }
        });
        rings.forEach(function (loop, i) {
          loop.material.color.setHex(i === nearest ? 0xf3f3f3 : 0x3a3a3a);
        });
      }
      setT(opts.t || 0);
      return { setT: setT, frame: function () {} };
    });
    if (!handle && container) container.innerHTML = fallback();
    return handle;
  }

  root.LCScale = { mount: mount, fallback: fallback };
})(typeof window !== 'undefined' ? window : globalThis);
