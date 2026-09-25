/* One lit core. Drag to turn it. It does not spin on its own. */
(function (root) {
  'use strict';

  var TILT = { earth: 23, mars: 25, saturn: 27, jupiter: 3, uranus: 98, venus: 3, neptune: 28, pluto: 23, moon: 6.7, mercury: 0.03, sun: 7 };

  function fallback(body) {
    var r = body.id === 'sun' ? 28 : 46;
    return '<svg class="graph" viewBox="0 0 320 220" role="img" aria-label="Shaded core of ' + body.title + '"><rect width="320" height="220" fill="#000"/><circle cx="150" cy="110" r="' + r + '" fill="#141414" stroke="#c8c8c8"/><path d="M150 64 A46 46 0 0 0 150 156" fill="#0b0b0b" stroke="none"/><line x1="150" y1="48" x2="168" y2="172" stroke="#f3f3f3"/><text x="16" y="28" fill="#8d8d8d" font-size="11" font-family="Share Tech Mono, ui-monospace, monospace">CORE · ' + body.title.toUpperCase() + '</text></svg>';
  }

  async function mount(container, opts) {
    var body = opts.body;
    var handle = await root.LCViz.open(container, opts, function (api) {
      var THREE = api.THREE;
      var segW = api.mobile ? 24 : 48;
      var segH = api.mobile ? 16 : 32;
      api.scene.add(new THREE.HemisphereLight(0x777777, 0x0a0a0a, 0.45));
      var key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(4, 2, 3);
      api.scene.add(key);
      var group = new THREE.Group();
      group.rotation.z = (TILT[body.id] || 0) * Math.PI / 180;
      var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, segW, segH),
        root.LCViz.planetMaterial(THREE, body.id, api.mobile)
      );
      group.add(mesh);
      group.add(new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 1.02, 0),
          new THREE.Vector3(0, 1.22, 0),
          new THREE.Vector3(0, -1.02, 0),
          new THREE.Vector3(0, -1.22, 0)
        ]),
        new THREE.LineBasicMaterial({ color: 0xf3f3f3 })
      ));
      if (body.id === 'saturn') {
        var ring = new THREE.Mesh(
          new THREE.RingGeometry(1.4, 2.2, api.mobile ? 48 : 80),
          new THREE.MeshStandardMaterial({
            map: root.LCViz.ringTexture(THREE, api.mobile),
            transparent: true,
            roughness: 1,
            metalness: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
      if (body.id === 'sun') {
        var halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: root.LCViz.haloTexture(THREE),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        }));
        halo.scale.set(3.4, 3.4, 1);
        api.scene.add(halo);
      }
      api.scene.add(group);
      root.LCViz.bindOrbit(api, {
        dist: body.id === 'saturn' ? 5.4 : 3.4,
        min: 2.2,
        max: 9
      });
      return { frame: function () {} };
    });
    if (!handle && container) container.innerHTML = fallback(body);
    return handle;
  }

  root.LCPlanet = { mount: mount, fallback: fallback };
})(typeof window !== 'undefined' ? window : globalThis);
