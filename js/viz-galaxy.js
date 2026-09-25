/* Two arms and one pip. A plot, not a sky. */
(function (root) {
  'use strict';

  async function mount(container, opts) {
    var handle = await root.LCViz.open(container, opts, function (api) {
      var THREE = api.THREE;
      var count = api.mobile ? 220 : 520;
      var positions = new Float32Array(count * 3);
      var i;
      for (i = 0; i < count; i++) {
        var arm = i % 2;
        var u = (i % (count / 2)) / (count / 2);
        var a = u * 4.6 + arm * Math.PI;
        var r = 0.25 + u * 3.6;
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = (Math.sin(i * 2.17) ) * 0.03;
        positions[i * 3 + 2] = Math.sin(a) * r;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      api.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xc8c8c8,
        size: api.mobile ? 1.8 : 2.2,
        sizeAttenuation: false
      })));
      var here = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xf3f3f3, emissive: 0xf3f3f3, emissiveIntensity: 0.6, roughness: 0.4 })
      );
      here.position.set(1.35, 0.02, 0.72);
      api.scene.add(here);
      api.scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0.9, 0, 0.28),
          new THREE.Vector3(1.35, 0.02, 0.72)
        ]),
        new THREE.LineBasicMaterial({ color: 0xf3f3f3 })
      ));
      root.LCViz.bindOrbit(api, { dist: 10.2, min: 6, max: 18, phi: 0.95 });
      return { frame: function () {} };
    });
    if (!handle && container && root.LCGraphs) container.innerHTML = root.LCGraphs.galaxyFlat();
    return handle;
  }

  root.LCGalaxy = { mount: mount };
})(typeof window !== 'undefined' ? window : globalThis);
