import {aviationRotation, attitudeLabels} from './orientation.js';

// Optional renderer: importing or initializing WebGL must never stop the lab.
export async function createAircraftView(panel) {
  const viewport = panel.querySelector('.aircraft-viewport');
  const status = panel.querySelector('.aircraft-status');
  let renderer, observer, lost = false, previousAttitude;
  try {
    const THREE = await import('../../vendor/three/three.module.js');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#9fbac6');
    scene.fog = new THREE.Fog('#9fbac6', 35, 100);
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute('aria-label', 'Aircraft attitude against a fixed north, east, south and west world grid');
    viewport.append(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 150);
    camera.position.set(7, 4.5, 8); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x566454, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-4, 8, 5); scene.add(light);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({color: '#647c69'}));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2.3; scene.add(ground);
    const grid = new THREE.GridHelper(40, 20, '#b5c4ae', '#80977f'); grid.position.y = -2.28; scene.add(grid);
    const aircraft = new THREE.Group(); scene.add(aircraft);
    const cream = new THREE.MeshLambertMaterial({color: '#eee9d8'});
    const gold = new THREE.MeshLambertMaterial({color: '#edaa45'});
    const dark = new THREE.MeshLambertMaterial({color: '#294b60'});
    function box(size, position, material = cream) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); aircraft.add(mesh); return mesh;
    }
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.26, .4, 3.5, 8), cream);
    fuselage.rotation.x = Math.PI / 2; aircraft.add(fuselage);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.4, .85, 8), gold);
    nose.rotation.x = -Math.PI / 2; nose.position.z = -2.1; aircraft.add(nose);
    box([5.8, .12, .85], [0, 0, -.15]);
    box([.25, .14, .86], [2.8, 0, -.15], gold);
    box([.25, .14, .86], [-2.8, 0, -.15], gold);
    box([2.2, .1, .55], [0, .08, 1.5]);
    box([.12, .95, .8], [0, .48, 1.35], gold);
    box([.48, .28, .8], [0, .32, -.7], dark);
    // Fixed world labels, not attached to aircraft or camera.
    const labels = [];
    for (const [text, x, z] of [['N · 000°', 0, -7], ['E · 090°', 7, 0], ['S · 180°', 0, 7], ['W · 270°', -7, 0]]) {
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f8f4e5'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 128, 43);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false}));
      sprite.position.set(x, -1.9, z); sprite.scale.set(2.8, .7, 1); scene.add(sprite); labels.push(texture);
    }
    function resize() {
      const {width, height} = viewport.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    }
    observer = new ResizeObserver(resize); observer.observe(viewport); resize();
    const fallback = () => {lost = true; status.hidden = false; status.textContent = '3D view unavailable. The cockpit instruments and controls remain active.'; renderer.domElement.hidden = true;};
    renderer.domElement.addEventListener('webglcontextlost', event => {event.preventDefault(); fallback();});
    status.hidden = true;
    return {
      update(state) {
        const signature = `${state.pitch}/${state.bank}/${state.heading}`;
        if (signature !== previousAttitude) {
          previousAttitude = signature;
          const labels = attitudeLabels(state);
          for (const key of ['pitch', 'bank', 'heading']) panel.querySelector(`[data-attitude="${key}"]`).textContent = labels[key];
        }
        if (lost) return;
        const r = aviationRotation(state); aircraft.rotation.set(r.x, r.y, r.z, r.order);
        // Render on the application's existing animation frame even when attitude
        // is unchanged. WebGL's default drawing buffer is not preserved after
        // compositing; skipping idle frames can leave captures/exposure blank.
        try {renderer.render(scene, camera);} catch {fallback();}
      },
      dispose() {
        observer.disconnect();
        scene.traverse(object => {object.geometry?.dispose(); const materials = object.material ? [object.material].flat() : []; materials.forEach(m => m.dispose());});
        labels.forEach(texture => texture.dispose()); renderer.dispose(); renderer.domElement.remove();
      }
    };
  } catch {
    observer?.disconnect(); renderer?.dispose(); renderer?.domElement.remove();
    status.hidden = false; status.textContent = '3D view unavailable (WebGL is required). The cockpit instruments and controls remain active.';
    return {update(state) {const labels = attitudeLabels(state); for (const key of ['pitch', 'bank', 'heading']) panel.querySelector(`[data-attitude="${key}"]`).textContent = labels[key];}, dispose() {}};
  }
}
