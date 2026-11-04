import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createGrabPhysics} from '../../VR_OBJECTS_TEMPLATE/physics-grab.js';
import {createLimbGrab} from './limb-grab.js?v=1';

const $=id=>document.getElementById(id);
function status(s){$('status').textContent=s;}
const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);renderer.xr.enabled=true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('scene').appendChild(renderer.domElement);
const rig=new THREE.Group();scene.add(rig);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.01,50000);
camera.position.set(0,1.65,2.65);rig.add(camera);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.18,-2);controls.enableDamping=true;controls.minDistance=.5;
controls.maxDistance=50000;controls.maxPolarAngle=Math.PI*.8;controls.update();
scene.add(new THREE.HemisphereLight(0xffffff,0x859ba3,2));
const key=new THREE.DirectionalLight(0xfff5e6,2.1);key.position.set(-2,4.7,2.5);scene.add(key);
// The shared Zelda v13 engine owns the whole character; trigger-based limb
// manipulation is an object-specific overlay. No engine replacement.
const modelAnchor=new THREE.Group();modelAnchor.position.set(0,1.18,-2.05);scene.add(modelAnchor);
let physics=null,limbs=null,avatar=null,dimensions=null;
const physicsReady=createGrabPhysics({renderer,rig,modelAnchor,onStatus:status})
 .then(p=>{physics=p;if(dimensions)p.attachModel(dimensions);})
 .catch(e=>{console.error('Shared physics failed',e);status('Shared controller initialisation failed: '+e.message);});
new GLTFLoader().load('./assets/character-rigged.glb?v=1',gltf=>{
 try{
  avatar=gltf.scene;
  const meshes=[];avatar.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
  if(meshes.length!==1)throw new Error('Expected one skin-weighted mesh; got '+meshes.length);
  avatar.scale.setScalar(.84);avatar.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(avatar);
  dimensions=bounds.getSize(new THREE.Vector3());
  if(dimensions.y<1 || dimensions.y>2.3)throw new Error('Unexpected character height '+dimensions.y);
  avatar.position.sub(bounds.getCenter(new THREE.Vector3()));
  avatar.updateMatrixWorld(true);
  modelAnchor.add(avatar);
  limbs=createLimbGrab({renderer,camera,controls,avatar,modelAnchor,getPhysics:()=>physics,onStatus:status});
  if(physics)physics.attachModel(dimensions);
  status('Character ready. Squeeze SIDE GRIP for whole doll; hold TRIGGER near a grey circle to pose that body part.');
 }catch(e){console.error(e);status('Character rig load failed: '+e.message);}
},undefined,e=>{console.error(e);status('Failed to load rigged GLB. '+(e.message||e));});

// Preserve original v13 joystick semantics: left X model lateral, either Y
// model depth, right X view snap or 30-degree held-character turn.
const keys=new Set();
window.addEventListener('keydown',e=>{keys.add(e.code);if(e.code.startsWith('Arrow'))e.preventDefault();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
const xrHead=new THREE.Quaternion(),xrRig=new THREE.Quaternion(),xrRight=new THREE.Vector3(),
 xrViewer=new THREE.Vector3(),xrPivotBefore=new THREE.Vector3(),xrPivotAfter=new THREE.Vector3(),
 xrLocalHead=new THREE.Vector3();
let snapTurnReady=true;
function activeStick(gamepad){
 const a=gamepad.axes||[];
 const pair=(x,y)=>Number.isFinite(a[x])&&Number.isFinite(a[y])?{x:a[x],y:a[y]}:null;
 const main=pair(2,3),fallback=pair(0,1);
 if(main&&(Math.abs(main.x)>.12||Math.abs(main.y)>.12))return main;
 if(fallback&&(Math.abs(fallback.x)>.12||Math.abs(fallback.y)>.12))return fallback;
 return main||fallback||{x:0,y:0};
}
function snapView(dir,pose){
 const p=pose.transform.position;xrLocalHead.set(p.x,p.y,p.z);
 rig.updateMatrixWorld(true);xrPivotBefore.copy(xrLocalHead);rig.localToWorld(xrPivotBefore);
 rig.rotation.y-=dir*THREE.MathUtils.degToRad(30);rig.updateMatrixWorld(true);
 xrPivotAfter.copy(xrLocalHead);rig.localToWorld(xrPivotAfter);
 rig.position.x+=xrPivotBefore.x-xrPivotAfter.x;rig.position.z+=xrPivotBefore.z-xrPivotAfter.z;
}
function updateXR(dt,frame){
 const session=renderer.xr.getSession(),space=renderer.xr.getReferenceSpace();
 const pose=frame&&space?frame.getViewerPose(space):null;if(!session||!pose)return;
 let left=null,right=null;
 for(const source of session.inputSources){if(!source.gamepad)continue;
  const stick=activeStick(source.gamepad);
  if(source.handedness==='left')left=stick;
  if(source.handedness==='right')right=stick;
 }
 if(right&&!physics?.isHolding('right')){
  if(Math.abs(right.x)<.30)snapTurnReady=true;
  if(snapTurnReady&&Math.abs(right.x)>.70){snapView(right.x>0?1:-1,pose);snapTurnReady=false;}
 }else if(right)snapTurnReady=true;
 const side=left&&Math.abs(left.x)>.16?left.x:0;
 const lDepth=left&&Math.abs(left.y)>.16?left.y:0;
 const rDepth=right&&Math.abs(right.y)>.16?right.y:0;
 const depth=Math.abs(rDepth)>=Math.abs(lDepth)?rDepth:lDepth;
 if(!physics||(!depth&&!side))return;
 const eye=pose.transform.position;xrViewer.set(eye.x,eye.y,eye.z);
 rig.updateMatrixWorld(true);rig.localToWorld(xrViewer);
 if(depth)physics.adjustModelDepth(depth,dt,xrViewer);
 if(side){const o=pose.transform.orientation;xrHead.set(o.x,o.y,o.z,o.w);
  rig.getWorldQuaternion(xrRig);xrHead.premultiply(xrRig);
  xrRight.set(1,0,0).applyQuaternion(xrHead);xrRight.y=0;
  if(xrRight.lengthSq()>1e-6)physics.adjustModelSide(side,dt,xrRight.normalize());
 }
}
const UP=new THREE.Vector3(0,1,0);
function updateDesktop(dt){
 const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),
 strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
 const len=Math.hypot(forward,strafe);if(!len)return;
 const f=new THREE.Vector3();camera.getWorldDirection(f);f.y=0;f.normalize();
 const r=new THREE.Vector3().crossVectors(f,UP).normalize();
 const speed=(keys.has('ShiftLeft')?3:1.5)*dt/len;
 rig.position.addScaledVector(f,forward*speed).addScaledVector(r,strafe*speed);
 controls.target.addScaledVector(f,forward*speed).addScaledVector(r,strafe*speed);
}
function reset(){
 limbs?.reset();physics?.reset();rig.position.set(0,0,0);rig.rotation.y=0;snapTurnReady=true;
 if(!renderer.xr.isPresenting){camera.position.set(0,1.65,2.65);controls.target.set(0,1.18,-2);controls.update();}
 status('Pose reset. Side-grip = whole doll; trigger near ring = limb articulation.');
}
$('reset').addEventListener('click',reset);
const enter=$('enterAR');let arSupported=false;
if(!window.isSecureContext){enter.textContent='HTTPS REQUIRED';status('Use the HTTPS GitHub Pages object URL.');}
else if(!navigator.xr){enter.textContent='OPEN ON QUEST 3';status('Desktop preview available. Meta Quest Browser is required for passthrough.');}
else navigator.xr.isSessionSupported('immersive-ar').then(ok=>{
 arSupported=ok;enter.disabled=!ok;enter.textContent=ok?'ENTER PASSTHROUGH':'PASSTHROUGH UNAVAILABLE';
}).catch(e=>status('WebXR check failed: '+e.message));
enter.addEventListener('click',async()=>{
 if(!arSupported)return;enter.disabled=true;
 try{const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['local-floor']});
  await renderer.xr.setSession(session);controls.enabled=false;
  camera.position.set(0,0,0);physics?.releaseAll();limbs?.releaseAll();
  enter.textContent='PASSTHROUGH ACTIVE';
  status('Grip side squeeze moves full doll. Trigger near light grey circle moves head, torso, hands or legs.');
 }catch(e){console.error(e);status('AR failed: '+e.name+': '+e.message);enter.textContent='RETRY PASSTHROUGH';}
 finally{enter.disabled=false;}
});
renderer.xr.addEventListener('sessionend',()=>{
 controls.enabled=true;camera.position.set(0,1.65,2.65);controls.target.set(0,1.18,-2);controls.update();
 enter.textContent='ENTER PASSTHROUGH';status('Desktop pose preview active.');
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let last=0;
renderer.setAnimationLoop((time,frame)=>{
 const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
 if(renderer.xr.isPresenting){physics?.pollGrips();updateXR(dt,frame);}
 else{updateDesktop(dt);controls.update();}
 physics?.update(dt);limbs?.update(dt);
 renderer.render(scene,camera);
});
