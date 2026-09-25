/* Dark mass, thin disk, one bright ring. Illustration, not a solver. */
(function (root) {
  'use strict';

  function fallback() {
    return '<svg class="graph" viewBox="0 0 480 280" role="img" aria-label="Black hole illustration: dark mass, disk, and ring"><rect width="480" height="280" fill="#000"/><ellipse cx="240" cy="150" rx="150" ry="36" fill="none" stroke="#8d8d8d"/><ellipse cx="240" cy="150" rx="92" ry="22" fill="none" stroke="#ececec"/><circle cx="240" cy="150" r="28" fill="#000" stroke="#f3f3f3"/><text x="20" y="32" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">ILLUSTRATION · NO SIGNAL INSIDE THE MARK</text></svg>';
  }

  async function mount(container, opts) {
    var handle = await root.LCViz.open(container, opts, function (api) {
      var THREE = api.THREE;
      api.scene.add(new THREE.HemisphereLight(0x222222, 0x000000, 0.4));
      var mass = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, api.mobile ? 24 : 48, api.mobile ? 16 : 32),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.35, metalness: 0.1 })
      );
      api.scene.add(mass);
      var disk = new THREE.Mesh(
        new THREE.RingGeometry(1.15, 2.8, api.mobile ? 48 : 96),
        new THREE.MeshStandardMaterial({
          map: root.LCViz.diskTexture(THREE),
          emissive: 0xbfbfbf,
          emissiveIntensity: 0.35,
          transparent: true,
          roughness: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      disk.rotation.x = Math.PI / 2.35;
      api.scene.add(disk);
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.018, 12, api.mobile ? 64 : 96),
        new THREE.MeshStandardMaterial({ color: 0xf3f3f3, emissive: 0xf3f3f3, emissiveIntensity: 1.1, roughness: 0.25 })
      );
      ring.rotation.x = Math.PI / 2.35;
      api.scene.add(ring);
      root.LCViz.bindOrbit(api, { dist: 6.4, min: 3.6, max: 12, phi: 1.02 });
      return { frame: function () {} };
    });
    if (!handle && container) container.innerHTML = fallback();
    return handle;
  }

  root.LCHole = { mount: mount, fallback: fallback };
})(typeof window !== 'undefined' ? window : globalThis);
