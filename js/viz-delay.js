/* Two masses and one pulse. The plate number is the fact. */
(function (root) {
  'use strict';

  function fallback() {
    return '<svg class="graph" viewBox="0 0 640 140" role="img" aria-label="Light-delay baseline"><rect width="640" height="140" fill="#000"/><line x1="80" y1="70" x2="560" y2="70" stroke="#c8c8c8"/><circle cx="80" cy="70" r="7" fill="#f3f3f3"/><circle cx="560" cy="70" r="7" fill="#8d8d8d"/><circle cx="280" cy="70" r="4" fill="#f3f3f3"/><text x="20" y="28" fill="#8d8d8d" font-size="12" font-family="Share Tech Mono, ui-monospace, monospace">TEMPO IS ILLUSTRATIVE</text></svg>';
  }

  async function mount(container, opts) {
    var handle = await root.LCViz.open(container, opts, function (api) {
      var THREE = api.THREE;
      api.scene.add(new THREE.HemisphereLight(0x888888, 0x111111, 0.6));
      var key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(2, 3, 4);
      api.scene.add(key);
      var mat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.45, metalness: 0.05 });
      var a = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 20), mat);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), mat.clone());
      a.position.x = -1.6;
      b.position.x = 1.6;
      var shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 3.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x8d8d8d, roughness: 0.6 })
      );
      shaft.rotation.z = Math.PI / 2;
      var pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xf3f3f3, emissive: 0xf3f3f3, emissiveIntensity: 0.9, roughness: 0.3 })
      );
      api.scene.add(shaft);
      api.scene.add(a);
      api.scene.add(b);
      api.scene.add(pulse);
      api.camera.position.set(0, 0.72, 3.5);
      api.camera.lookAt(0, 0, 0);
      return {
        frame: function (reduce) {
          var u = reduce ? 0.42 : (performance.now() % 2800) / 2800;
          pulse.position.x = -1.6 + u * 3.2;
        }
      };
    });
    if (!handle && container) container.innerHTML = fallback();
    return handle;
  }

  root.LCDelay = { mount: mount, fallback: fallback };
})(typeof window !== 'undefined' ? window : globalThis);
