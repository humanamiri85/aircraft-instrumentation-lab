import * as THREE from '../../../vendor/three/three.module.js';

// Rendering only: model.js supplies all coordinate transforms.
export function createGyroScene(viewport) {
  let renderer;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101b23');
  function dispose() {
    observer?.disconnect();
    scene.traverse(object=>{object.geometry?.dispose(); for(const material of object.material?[object.material].flat():[]) {material.map?.dispose();material.dispose();}});
    renderer?.dispose(); renderer?.domElement.remove();
  }
  let observer;
  try {
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2));
    renderer.domElement.setAttribute('role','img');
    renderer.domElement.setAttribute('aria-label','Gyroscope: fixed north spin axis inside moving aircraft frame and two gimbal rings. Text below gives the same axes and relative motion.');
    viewport.append(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(38,1,.1,50);
    camera.position.set(7.5,5.8,9); camera.lookAt(0,0,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x263c4c,2.5));
    const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,6,5);scene.add(light);
    const parts = {};
    const body=new THREE.Group();scene.add(body);
    const outer=new THREE.Group();body.add(outer);
    const inner=new THREE.Group();outer.add(inner);
    const rotor=new THREE.Group();inner.add(rotor);
    const ring=(radius,color,parent,axis)=>{
      const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,.045,8,80),new THREE.MeshStandardMaterial({color,roughness:.7}));
      if(axis==='y')mesh.rotation.x=Math.PI/2;
      if(axis==='x')mesh.rotation.y=Math.PI/2;
      parent.add(mesh);return mesh;
    };
    parts.outer=ring(1.65,'#79c9de',outer,'z');
    parts.inner=ring(1.38,'#e7e9df',inner,'y');
    // Bearing pins meet ring diameters, rather than floating normal to a ring.
    function pin(parent,axis,position,length,color) {
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,length,12),new THREE.MeshStandardMaterial({color}));
      if(axis==='x')mesh.rotation.z=Math.PI/2;
      mesh.position.set(...position);parent.add(mesh);
    }
    for(const sign of [-1,1]) {
      pin(body,'y',[0,sign*1.9,0],.5,'#79c9de');
      pin(outer,'x',[sign*1.5,0,0],.3,'#e7e9df');
    }
    parts.rotor=rotor;
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(1.03,1.03,.16,48),new THREE.MeshStandardMaterial({color:'#bc8744',roughness:.8}));
    wheel.rotation.x=Math.PI/2;rotor.add(wheel);
    ring(1.06,'#f3c57a',rotor,'z');
    // Asymmetric spokes make the slow visual spin visible on both wheel faces.
    for(const z of [-.1,.1])for(let i=0;i<3;i++) {
      const spoke=new THREE.Mesh(new THREE.BoxGeometry(.8,.045,.02),new THREE.MeshBasicMaterial({color:'#172832'}));
      const a=i*2*Math.PI/3;spoke.position.set(.5*Math.cos(a),.5*Math.sin(a),z);spoke.rotation.z=a;rotor.add(spoke);
    }
    const arrows=new THREE.Group();inner.add(arrows);parts.spin=arrows;
    arrows.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(0,0,1.25),3.6,0xf3c57a,.18,.1));
    const bearings=new THREE.Group();scene.add(bearings);
    const outerBearing=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),2,0x79c9de,.15,.08);
    const innerBearing=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),2,0xe7e9df,.15,.08);
    bearings.add(outerBearing,innerBearing);
    parts.body=new THREE.Group();body.add(parts.body);
    function label(text,position,parent) {
      const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');
      ctx.font='bold 28px sans-serif';canvas.width=Math.ceil(ctx.measureText(text).width)+24;canvas.height=48;
      ctx.fillStyle='#f4f2e8';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.fillText(text,canvas.width/2,34);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));
      sprite.position.set(...position);sprite.scale.set(canvas.width*.014,canvas.height*.014,1);parent.add(sprite);return sprite;
    }
    for(const [name,axis] of [['NOSE · −Z',[0,0,-1]],['RIGHT · +X',[1,0,0]],['UP · +Y',[0,1,0]]]) {
      const direction=new THREE.Vector3(...axis);parts.body.add(new THREE.ArrowHelper(direction,new THREE.Vector3(),2.5,0x94bd9c,.18,.08));label(name,direction.multiplyScalar(2.8).toArray(),parts.body);
    }
    const box=new THREE.EdgesGeometry(new THREE.BoxGeometry(4.3,4.3,4.3));
    const mounting=new THREE.LineSegments(box,new THREE.LineDashedMaterial({color:'#94bd9c',dashSize:.15,gapSize:.1}));mounting.computeLineDistances();body.add(mounting);parts.instrument=mounting;
    label('FIXED WORLD · NORTH',[0,-3,0],scene);
    label('SPIN AXIS',[0,.3,-2.05],scene);
    const bearingLabels=new THREE.Group();scene.add(bearingLabels);
    label('OUTER · BODY +Y',[0,2.3,0],bearingLabels);
    label('INNER · LOCAL +X',[2.3,0,0],bearingLabels);
    observer=new ResizeObserver(()=>resize());observer.observe(viewport);
    let lastWidth=0,lastHeight=0;
    function resize() {
      const width=viewport.clientWidth,height=viewport.clientHeight;
      if(!width||!height||(width===lastWidth&&height===lastHeight))return;
      lastWidth=width;lastHeight=height;renderer.setSize(width,height,false);camera.aspect=width/height;
      camera.position.set(7.5,5.8,9).multiplyScalar(Math.max(1,1/camera.aspect));
      camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    }
    let lost=false;
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;});
    return {dispose,update(model,phase,mode,component,reduced) {
      if(lost)throw new Error('Gyroscope WebGL context lost');
      body.quaternion.copy(model.body);outer.rotation.y=model.outer;inner.rotation.x=model.inner;rotor.rotation.z=-phase;
      outerBearing.setDirection(model.outerAxis);innerBearing.setDirection(model.innerAxis);
      bearingLabels.children[0].position.copy(model.outerAxis).multiplyScalar(2.3);
      bearingLabels.children[1].position.copy(model.innerAxis).multiplyScalar(2.3);
      bearings.visible=bearingLabels.visible=mode==='axes';
      mounting.material.opacity=mode==='rigidity'?.95:.4;mounting.material.transparent=true;
      for(const [id,object] of Object.entries(parts))object.traverse(child=>{for(const material of child.material?[child.material].flat():[])if(material.emissive)material.emissive.set(id===component?'#51401e':'#000000');});
      resize();renderer.render(scene,camera);
      // Expose actual scene transforms for regression checks, not duplicate model values.
      body.updateMatrixWorld(true);
      renderer.domElement.dataset.bodyQuaternion=JSON.stringify(body.getWorldQuaternion(new THREE.Quaternion()).toArray());
      renderer.domElement.dataset.spinAxis=JSON.stringify(new THREE.Vector3(0,0,-1).applyQuaternion(inner.getWorldQuaternion(new THREE.Quaternion())).toArray());
      renderer.domElement.dataset.phase=String(rotor.rotation.z);
    }};
  } catch(error) {dispose();throw error;}
}
