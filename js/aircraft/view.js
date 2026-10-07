import {aviationRotation} from './orientation.js';

import {GROUND_Y, altitudeHeight, airspeedRate, verticalCue, verticalLabel, flightLabels} from './flight-cues.js';

// Optional renderer: importing or initializing WebGL must never stop the lab.
export async function createAircraftView(panel) {
  const viewport = panel.querySelector('.aircraft-viewport');
  const status = panel.querySelector('.aircraft-status');
  const hud = panel.querySelector('#flight-data');
  const toggle = panel.querySelector('#show-flight-data');
  const toggleHUD = () => {hud.hidden = !toggle.checked;};
  toggle.addEventListener('change', toggleHUD);
  function updateLabels(state) {
    const labels = flightLabels(state);
    for (const [key, value] of Object.entries(labels)) {
      const field = panel.querySelector(`[data-flight="${key}"]`);
      if (field.textContent !== value) field.textContent = value;
    }
    panel.querySelector('[data-cue="altitude"]').textContent = `ALT ${labels.altitude}`;
    panel.querySelector('[data-cue="verticalSpeed"]').textContent = verticalLabel(state.verticalSpeed);
  }
  let renderer, observer, lost = false, flowPhase = 0;
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
    camera.position.set(10, 8, 12); camera.lookAt(0, 0.7, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x566454, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-4, 8, 5); scene.add(light);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({color: '#647c69'}));
    ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND_Y; scene.add(ground);
    const grid = new THREE.GridHelper(40, 20, '#b5c4ae', '#80977f'); grid.position.y = -2.28; scene.add(grid);
    // Bounded cues are created once and updated independently of attitude.
    const altitudeLine = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 6), new THREE.MeshBasicMaterial({color: '#ffe0a0'}));
    altitudeLine.position.x = 0; scene.add(altitudeLine);
    const groundRing = new THREE.Mesh(new THREE.RingGeometry(.35, .45, 24), new THREE.MeshBasicMaterial({color: '#ffe0a0', side: THREE.DoubleSide}));
    groundRing.rotation.x = -Math.PI / 2; groundRing.position.y = GROUND_Y + .04; scene.add(groundRing);
    const upDirection = new THREE.Vector3(0, 1, 0);
    const climbArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(3.7, 0, 0), 1, 0x244e68, .3, .18); scene.add(climbArrow);
    const flow = new THREE.Group(); scene.add(flow);
    for (let i = 0; i < 8; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(.035, .025, .8), new THREE.MeshBasicMaterial({color: '#d8e5d6'}));
      line.position.x = i % 2 === 0 ? -4 : 4;
      line.position.y = GROUND_Y + .06; flow.add(line);
    }
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
      const {width, height: outerHeight} = viewport.getBoundingClientRect();
      const height = outerHeight - parseFloat(getComputedStyle(viewport).paddingTop);
      if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height;
      // Stable camera; expand vertical FOV on narrow viewports to retain horizontal clearance.
      camera.fov = 2 * Math.atan(Math.tan(42 * Math.PI / 360) / Math.min(1, camera.aspect)) * 180 / Math.PI;
      camera.updateProjectionMatrix();
    }
    observer = new ResizeObserver(resize); observer.observe(viewport); resize();
    const fallback = error => {
      if (error) console.error('Aircraft renderer failed:', error);
      lost = true; status.hidden = false; status.textContent = '3D view unavailable. The cockpit instruments and controls remain active.'; renderer.domElement.hidden = true;};
    renderer.domElement.addEventListener('webglcontextlost', event => {event.preventDefault(); fallback();});
    status.hidden = true;
    return {
      update(state, dt = 0, reducedMotion = false) {
        updateLabels(state);
        if (lost) return;
        const height = altitudeHeight(state.altitude);
        aircraft.position.y = height;
        altitudeLine.scale.y = height - GROUND_Y;
        altitudeLine.position.y = (height + GROUND_Y) / 2;
        const cue = verticalCue(state.verticalSpeed);
        climbArrow.visible = cue.direction !== 0;
        climbArrow.position.set(3.7, height, 0);
        if (cue.direction) {
          climbArrow.setDirection(upDirection.set(0, cue.direction, 0));
          climbArrow.setLength(cue.length, .3, .18);
        }
        // Only decorative reference lines translate; IAS never moves aircraft.
        // Reduced motion uses static streak lengths as a speed cue.
        if (!reducedMotion) flowPhase = (flowPhase + airspeedRate(state.airspeed) * Math.min(Math.max(dt, 0), .1)) % 8;
        flow.rotation.y = -state.heading * Math.PI / 180;
        flow.children.forEach((line, i) => {
          line.position.z = ((Math.floor(i / 2) * 2 + (reducedMotion ? 0 : flowPhase)) % 8) - 4;
          line.scale.z = reducedMotion ? airspeedRate(state.airspeed) : 1;
        });
        const r = aviationRotation(state); aircraft.rotation.set(r.x, r.y, r.z, r.order);
        // Render on the application's existing animation frame even when attitude
        // is unchanged. WebGL's default drawing buffer is not preserved after
        // compositing; skipping idle frames can leave captures/exposure blank.
        try {renderer.render(scene, camera);} catch (error) {fallback(error);}
      },
      dispose() {
        observer.disconnect(); toggle.removeEventListener('change', toggleHUD);
        scene.traverse(object => {object.geometry?.dispose(); const materials = object.material ? [object.material].flat() : []; materials.forEach(m => m.dispose());});
        labels.forEach(texture => texture.dispose()); renderer.dispose(); renderer.domElement.remove();
      }
    };
  } catch (error) {
    console.error('Aircraft initialization failed:', error);
    observer?.disconnect(); renderer?.dispose(); renderer?.domElement.remove();
    status.hidden = false; status.textContent = '3D view unavailable (WebGL is required). The cockpit instruments and controls remain active.';
    return {update: updateLabels, dispose() {toggle.removeEventListener('change', toggleHUD);}};
  }
}
