import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGrabPhysics } from './physics-grab.js?v=10.1';

const $ = (id) => document.getElementById(id);
const setStatus = (message) => { $('status').textContent = message; };
const stage = $('scene');
const scene = new THREE.Scene(); // Null background is mandatory: AR uses transparent compositing.
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor'); // All dimensions and controller movement are real metres.
renderer.shadowMap.enabled = false; // No visible stage or contact shadow in passthrough.
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const rig = new THREE.Group(); scene.add(rig);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.01, 50000); // Buildings/landmarks remain within depth range.
camera.position.set(0, 1.65, 2.65);
rig.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.75, -1.85);
controls.enableDamping = true;
controls.minDistance = .65;
controls.maxDistance = 50000;
controls.maxPolarAngle = Math.PI * .55;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x859ba3, 2.0));
const key = new THREE.DirectionalLight(0xfff5e6, 2.1);
key.position.set(-2, 4.7, 2.5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -5; key.shadow.camera.right = 5;
key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
key.shadow.normalBias = .02;
scene.add(key);

// The model is crouched, not standing: its original extents are approximately
// 1.67m long, 0.80m high and 1.23m wide. Do NOT stretch it to 1.7m tall.
// The user requested human scale, not a standing pose or animation.
const modelAnchor = new THREE.Group();
modelAnchor.position.set(0, 0.4, -2.0);
modelAnchor.rotation.y = -Math.PI / 2; // Turn the character's head (+X) toward the user (+Z).
scene.add(modelAnchor);
let avatar = null, physics = null, modelSize = null;
const physicsReady = createGrabPhysics({renderer,rig,modelAnchor,onStatus:setStatus})
  .then(instance => {
    physics=instance;
    if(modelSize)physics.attachModel(modelSize);
  })
  .catch(error => {
    console.error('Rapier physics could not initialize',error);
    setStatus('Physics failed to initialise: '+error.message);
  });
const loader = new GLTFLoader();
function placeLoadedModel(root) {
  if(avatar)modelAnchor.remove(avatar);
  avatar=root;
  // Original model is already in a human-length crouched pose; do not stretch it upright.
  const rawBounds=new THREE.Box3().setFromObject(root);
  const rawSize=rawBounds.getSize(new THREE.Vector3());
  const normalization=rawSize.x>.001?THREE.MathUtils.clamp(1.67/rawSize.x,.3,4):1;
  root.scale.multiplyScalar(normalization);
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  const centre=bounds.getCenter(new THREE.Vector3());
  modelSize=bounds.getSize(new THREE.Vector3());
  // The physics body's origin is at the model's geometric centre, not its feet.
  // This allows free turning and upside-down placement; release freezes the pose.
  root.position.sub(centre);
  root.traverse(part => {if(part.isMesh){part.castShadow=false;part.receiveShadow=false;}});
  modelAnchor.add(root);
  modelAnchor.position.set(0,modelSize.y/2,-2);
  modelAnchor.rotation.set(0,-Math.PI/2,0);
  modelAnchor.scale.setScalar(1);
  if(physics)physics.attachModel(modelSize);
  setStatus('Zelda VR v10.1: Left stick X moves Zelda sideways, either Y pulls/pushes. Both grips resize linearly from 10% to 350%.');
}

// GitHub transfer stores this Quest-optimised GLB as eight byte-exact binary parts.
// Reassemble them in memory; the resulting ArrayBuffer is a valid standalone GLB.
async function loadSplitModel() {
  const urls = Array.from({length:8}, (_,i) => `./assets/zelda.part${String(i+1).padStart(2,'0')}`);
  try {
    setStatus('Loading Zelda from eight embedded-model segments…');
    const parts = await Promise.all(urls.map(async (url, i) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Model segment ${i+1} returned HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    }));
    const size = parts.reduce((total, bytes) => total + bytes.byteLength, 0);
    const combined = new Uint8Array(size);
    let offset = 0;
    for (const bytes of parts) { combined.set(bytes, offset); offset += bytes.byteLength; }
    if (size !== 11668312) throw new Error(`Unexpected model size: ${size} bytes`);
    const objectURL = URL.createObjectURL(new Blob([combined], {type:'model/gltf-binary'}));
    loadURL(objectURL, true);
  } catch(error) {
    console.error('Could not reconstruct Zelda GLB', error);
    setStatus(`Failed to load model segments: ${error.message}. You can still choose a local GLB below.`);
  }
}
function loadURL(url, revoke = false) {
  setStatus('Loading Zelda model and embedded textures…');
  loader.load(url, (gltf) => {placeLoadedModel(gltf.scene); if(revoke) URL.revokeObjectURL(url);},
    (event) => {if(event.total) setStatus(`Loading Zelda… ${Math.round(event.loaded / event.total * 100)}%`);},
    (error) => {
      if(revoke) URL.revokeObjectURL(url);
      if(url === './assets/zelda.glb') { loadSplitModel(); return; }
      console.error(error);
      setStatus('Could not decode Zelda GLB. Choose the extracted original GLB file below.');
    });
}
loadURL('./assets/zelda.glb');
$('assetFile').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file && /\.glb$/i.test(file.name)) loadURL(URL.createObjectURL(file), true);
  else setStatus('Select the extracted .glb file (not the .zip).');
});

// Gravity-free scene: no visible floor, no invisible collision floor,
// no grid, no ring and no shadow catcher. Released Zelda remains fixed.

// Controllers and their side-grip events are registered in physics-grab.js.
const keys = new Set();
window.addEventListener('keydown', e => {keys.add(e.code); if(e.code.startsWith('Arrow'))e.preventDefault();});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
const xrForward=new THREE.Vector3(),xrRight=new THREE.Vector3();
const xrHeadOrientation=new THREE.Quaternion(),xrRigOrientation=new THREE.Quaternion();
const xrLocalHead=new THREE.Vector3(),xrPivotBefore=new THREE.Vector3(),xrPivotAfter=new THREE.Vector3();
const xrViewerWorld=new THREE.Vector3();
const UP=new THREE.Vector3(0,1,0);
let snapTurnReady=true;
const HOME={x:0,z:0};
function activeStick(gamepad) {
  const axes=gamepad.axes||[];
  const pair=(x,y)=>Number.isFinite(axes[x])&&Number.isFinite(axes[y])?{x:axes[x],y:axes[y]}:null;
  const main=pair(2,3),fallback=pair(0,1);
  if(main&&(Math.abs(main.x)>.12||Math.abs(main.y)>.12)) return main;
  if(fallback&&(Math.abs(fallback.x)>.12||Math.abs(fallback.y)>.12))return fallback;
  return main||fallback||{x:0,y:0};
}
function snapTurn(direction, viewerPose){
  // Preserve physical head position when rotating the locomotion rig.
  const pos=viewerPose.transform.position;
  xrLocalHead.set(pos.x,pos.y,pos.z);
  rig.updateMatrixWorld(true);
  xrPivotBefore.copy(xrLocalHead);rig.localToWorld(xrPivotBefore);
  rig.rotation.y-=direction*THREE.MathUtils.degToRad(30);
  rig.updateMatrixWorld(true);
  xrPivotAfter.copy(xrLocalHead);rig.localToWorld(xrPivotAfter);
  rig.position.x+=xrPivotBefore.x-xrPivotAfter.x;
  rig.position.z+=xrPivotBefore.z-xrPivotAfter.z;
}
function updateXR(dt, frame){
  const session=renderer.xr.getSession();
  const space=renderer.xr.getReferenceSpace();
  const pose=frame&&space?frame.getViewerPose(space):null;
  if(!session||!pose)return;
  let left=null,right=null;
  for(const source of session.inputSources){
    if(!source.gamepad)continue;
    const stick=activeStick(source.gamepad);
    if(source.handedness==='left') left=stick;
    if(source.handedness==='right') right=stick;
  }
  // A held controller's stick rotates Zelda, not the player.
  // When that grip is released, the usual locomotion/snap-turn controls resume.
  if(right && !physics?.isHolding('right')){
    if(Math.abs(right.x)<.30) snapTurnReady=true;
    if(snapTurnReady&&Math.abs(right.x)>.70){snapTurn(right.x>0?1:-1,pose);snapTurnReady=false;}
  } else if(right) {
    snapTurnReady=true; // Re-arm the view control while Zelda is being held.
  }
  // Version 10: both vertical sticks still pull/push the CHARACTER, never
  // move the player. Left-stick X now translates the CHARACTER sideways too,
  // even during a left grip. The right-stick X logic above stays unchanged:
  // free = view snap-turn, right grip = Zelda 30° yaw.
  const side=left && Math.abs(left.x)>.16?left.x:0;
  const leftDepth=left && Math.abs(left.y)>.16?left.y:0;
  const rightDepth=right && Math.abs(right.y)>.16?right.y:0;
  const modelDepth=Math.abs(rightDepth)>=Math.abs(leftDepth)?rightDepth:leftDepth;
  if(!physics || (!modelDepth&&!side))return;
  const eye=pose.transform.position;
  xrViewerWorld.set(eye.x,eye.y,eye.z);
  rig.updateMatrixWorld(true);
  rig.localToWorld(xrViewerWorld);
  if(modelDepth)physics.adjustModelDepth(modelDepth,dt,xrViewerWorld);
  if(side) {
    const o=pose.transform.orientation;
    xrHeadOrientation.set(o.x,o.y,o.z,o.w);
    rig.getWorldQuaternion(xrRigOrientation);
    xrHeadOrientation.premultiply(xrRigOrientation);
    xrRight.set(1,0,0).applyQuaternion(xrHeadOrientation);
    xrRight.y=0;
    if(xrRight.lengthSq()>1e-6) {
      xrRight.normalize();
      physics.adjustModelSide(side,dt,xrRight);
    }
  }
}
function updateDesktop(dt){
  const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0);
  const strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  const len=Math.hypot(forward,strafe);
  if(!len)return;
  const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);cameraForward.y=0;cameraForward.normalize();
  const cameraRight=new THREE.Vector3().crossVectors(cameraForward,UP).normalize();
  const speed=(keys.has('ShiftLeft')?3:1.5)*dt/len;
  rig.position.addScaledVector(cameraForward,forward*speed);
  rig.position.addScaledVector(cameraRight,strafe*speed);
  controls.target.addScaledVector(cameraForward,forward*speed);
  controls.target.addScaledVector(cameraRight,strafe*speed);
}
function resetView(){
  rig.position.set(HOME.x,0,HOME.z);rig.rotation.y=0;snapTurnReady=true;
  if(!renderer.xr.isPresenting){camera.position.set(0,1.65,2.65);controls.target.set(0,.75,-1.85);controls.update();}
  physics?.reset();
  setStatus('Version 10.1 reset. Left X moves Zelda sideways, either Y pulls/pushes. Two-hand resizing is 10% to 350%.');
}
$('reset').addEventListener('click',resetView);

const enter=$('enterAR');
let arSupported=false;
if(!window.isSecureContext){enter.textContent='HTTPS REQUIRED';setStatus('Open the secure GitHub Pages URL, not a local file.');}
else if(!navigator.xr){enter.textContent='OPEN ON QUEST 3';setStatus('Desktop preview is available. Passthrough requires Meta Quest Browser with WebXR AR support.');}
else{
  navigator.xr.isSessionSupported('immersive-ar').then(supported=>{
    arSupported=supported;enter.disabled=!supported;
    enter.textContent=supported?'ENTER PASSTHROUGH':'PASSTHROUGH UNAVAILABLE';
    if(!supported)setStatus('This browser does not offer immersive-ar. Open the site in Meta Quest Browser and allow the required permissions.');
  }).catch(error=>{enter.textContent='PASSTHROUGH CHECK FAILED';setStatus(error.message);});
}
enter.addEventListener('click',async()=>{
  if(!arSupported)return;
  enter.disabled=true;
  try{
    const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['local-floor']});
    await renderer.xr.setSession(session);
    controls.enabled=false;
    camera.position.set(0,0,0); // Never reuse the desktop orbit offset in XR.
    enter.textContent='PASSTHROUGH ACTIVE';
    physics?.releaseAll();
    setStatus('Zelda VR v10.1: Left X moves Zelda sideways; either stick Y pulls/pushes. Both grips resize 10%–350%.');
  }catch(error){console.error(error);enter.textContent='RETRY PASSTHROUGH';setStatus(`Could not start AR: ${error.name}: ${error.message}`);}
  finally{enter.disabled=false;}
});
renderer.xr.addEventListener('sessionend',()=>{
  controls.enabled=true;
  camera.position.set(0,1.65,2.65);
  controls.target.set(0,.75,-1.85); controls.update();
  enter.textContent='ENTER PASSTHROUGH';
  setStatus('Passthrough session ended. Desktop preview active.');
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
let previous=0;
renderer.setAnimationLoop((time,frame)=>{
  const dt=previous?Math.min(.05,(time-previous)/1000):0;
  previous=time;
  if(renderer.xr.isPresenting) {
    physics?.pollGrips(); // Resolve grip before routing thumbstick actions.
    updateXR(dt,frame);
  } else {updateDesktop(dt);controls.update();}
  physics?.update(dt);
  renderer.render(scene,camera);
});