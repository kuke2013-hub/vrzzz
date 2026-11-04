import * as THREE from 'three';

// Anatomical pose manipulator. Uses WebXR trigger/select, NOT v13 side-squeeze.
// Hence the canonical shared physics-grab.js can remain completely untouched.
// Approximate anthropometric joint restrictions, not medical-grade joint physics.
const X=new THREE.Vector3(),Y=new THREE.Vector3(),Z=new THREE.Vector3(),Q=new THREE.Quaternion();
const clamp=THREE.MathUtils.clamp, rad=THREE.MathUtils.degToRad;
const HEAD_LIMITS={x:42,y:65,z:35};
const RESTORE_NAMES=['Hips','Spine','Spine1','Chest','Neck','Head',
 'LeftShoulder','LeftUpperArm','LeftLowerArm','LeftHand','RightShoulder','RightUpperArm','RightLowerArm','RightHand',
 'LeftUpperLeg','LeftLowerLeg','LeftFoot','LeftToes','RightUpperLeg','RightLowerLeg','RightFoot','RightToes'];

function makeRingTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;
 const ctx=c.getContext('2d');ctx.clearRect(0,0,128,128);
 ctx.beginPath();ctx.arc(64,64,39,0,Math.PI*2);ctx.fillStyle='rgba(178,187,196,.24)';ctx.fill();
 ctx.strokeStyle='rgba(227,233,237,.96)';ctx.lineWidth=8;ctx.stroke();
 ctx.beginPath();ctx.arc(64,64,9,0,Math.PI*2);ctx.fillStyle='rgba(241,245,248,.84)';ctx.fill();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function extractBones(avatar){
 const found={};avatar.traverse(obj=>{if(obj.isBone)found[obj.name]=obj;});
 for(const name of RESTORE_NAMES)if(!found[name])throw new Error('Missing bone: '+name);
 return found;
}
function readWorld(obj,v=new THREE.Vector3()){obj.updateWorldMatrix(true,false);return obj.getWorldPosition(v);}
function readWorldQuat(obj,q=new THREE.Quaternion()){obj.updateWorldMatrix(true,false);return obj.getWorldQuaternion(q);}
function orientTowards(bone,child,targetWorldDirection){
 // Incoming target is in WORLD space. Invert parent's quaternion to get the
 // target direction in the bone's parent frame, then rotate the bind direction.
 bone.parent.updateWorldMatrix(true,false);
 const parentQ=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
 const localDir=targetWorldDirection.clone().normalize().applyQuaternion(parentQ);
 const bindDir=child.position.clone().normalize();
 bone.quaternion.setFromUnitVectors(bindDir,localDir).normalize();
 bone.updateMatrixWorld(true);
}
function clampLocalRotation(bone,limits){
 const e=new THREE.Euler().setFromQuaternion(bone.quaternion,'XYZ');
 e.x=clamp(e.x,rad(-limits.x),rad(limits.x));
 e.y=clamp(e.y,rad(-limits.y),rad(limits.y));
 e.z=clamp(e.z,rad(-limits.z),rad(limits.z));
 bone.quaternion.setFromEuler(e);
}

export function createLimbGrab({renderer, camera, controls, avatar, modelAnchor, getPhysics, onStatus}){
 const bones=extractBones(avatar);
 const rest={};Object.keys(bones).forEach(n=>rest[n]=bones[n].quaternion.clone());
 const specs=[
  ['Head','Head',[0,.072,.115],'head'],
  ['Neck','Neck',[0,.002,.060],'neck'],
  ['Chest','Chest',[0,-.014,.11],'chest'],
  ['Pelvis','Hips',[0,0,.115],'pelvis'],
  ['LeftShoulder','LeftUpperArm',[-.003,-.02,0],'joint'],
  ['RightShoulder','RightUpperArm',[.003,-.02,0],'joint'],
  ['LeftElbow','LeftLowerArm',[-.012,0,0],'joint'],
  ['RightElbow','RightLowerArm',[.012,0,0],'joint'],
  ['LeftHand','LeftHand',[-.008,-.046,.018],'armIK'],
  ['RightHand','RightHand',[.008,-.046,.018],'armIK'],
  ['LeftThigh','LeftUpperLeg',[0,-.190,.027],'legIK'],
  ['RightThigh','RightUpperLeg',[0,-.190,.027],'legIK'],
  ['LeftKnee','LeftLowerLeg',[0,0,.057],'joint'],
  ['RightKnee','RightLowerLeg',[0,0,.057],'joint'],
  ['LeftFoot','LeftFoot',[0,-.052,.072],'legIK'],
  ['RightFoot','RightFoot',[0,-.052,.072],'legIK'],
 ];
 const ringTexture=makeRingTexture();const handles=[];
 specs.forEach(([id,bname,offset,mode])=>{
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:ringTexture,transparent:true,depthTest:false,depthWrite:false,opacity:.88}));
  sprite.name='Grip_'+id;sprite.scale.set(.072,.072,1);sprite.position.fromArray(offset);
  bones[bname].add(sprite);sprite.visible=false;
  handles.push({id,bname,mode,sprite,bone:bones[bname]});
 });
 const controllerNodes=[renderer.xr.getController(0),renderer.xr.getController(1)];
 const gripNodes=[renderer.xr.getControllerGrip(0),renderer.xr.getControllerGrip(1)];
 const holds=new Map();let mouseHold=null;
 const center=new THREE.Vector3(),ctrlPt=new THREE.Vector3();
 const cameraForward=new THREE.Vector3();
 const worldScale=new THREE.Vector3();
 function jointFor(handle){
  if(handle.mode==='armIK')return bones[handle.id];
  if(handle.id.endsWith('Thigh'))return handle.sprite;
  if(handle.mode==='legIK')return bones[handle.id];
  return handle.bone;
 }
 function chooseNear(controller){
  const cp=readWorld(controller,ctrlPt);
  let best=null,dist=.19;
  for(const h of handles){const pos=readWorld(h.sprite,center),d=pos.distanceTo(cp);
   if(d<dist){best=h;dist=d;}}
  return best;
 }
 function makeHold(h,pos,ctrlQuat){
  const j=jointFor(h);
  return {h,initialController:pos.clone(),initialJoint:readWorld(j).clone(),
   startAnchor: modelAnchor.position.clone(),startCtrlQuat:ctrlQuat.clone(),
   startBoneQuat:h.bone.quaternion.clone(),startWorldBoneQuat:readWorldQuat(h.bone),
   anchorQ: modelAnchor.quaternion.clone()};
 }
 function selectStart(i){
  if(!renderer.xr.isPresenting)return;
  const controller=gripNodes[i];const h=chooseNear(controller);
  if(!h)return;
  const cp=readWorld(controller).clone(),cq=readWorldQuat(controller);
  holds.set(i,makeHold(h,cp,cq));
  onStatus?.('Holding '+h.id+'. Move the trigger hand; release to freeze the pose.');
 }
 function selectEnd(i){holds.delete(i);}
 controllerNodes.forEach((c,i)=>{
  c.addEventListener('selectstart',()=>selectStart(i));
  c.addEventListener('selectend',()=>selectEnd(i));
  c.addEventListener('disconnected',()=>selectEnd(i));
 });
 function moveRoot(worldDelta){
  const magnitude=worldDelta.length();if(magnitude<1e-8)return;
  // Work through the ORIGINAL shared engine's public side-translation method,
  // not an independent transform: it updates the fixed Rapier body as well,
  // ensuring the base engine does not snap the doll back on the next frame.
  // viewRight is a vector parameter; for anatomical follow it points in the
  // required world displacement direction, not only viewer-horizontal.
  const p=getPhysics?.();
  if(p){
   const seconds=Math.min(.05,magnitude/1.4);
   const normalized=worldDelta.clone().divideScalar(magnitude);
   p.adjustModelSide(magnitude/(1.4*seconds),seconds,normalized);
   return;
  }
  // Only used during the initial brief loading state before Rapier is ready.
  const parent=modelAnchor.parent;
  if(!parent){modelAnchor.position.add(worldDelta);return;}
  const q=readWorldQuat(parent).invert(),sc=parent.getWorldScale(new THREE.Vector3());
  modelAnchor.position.add(worldDelta.clone().applyQuaternion(q).divide(sc));
  modelAnchor.updateMatrixWorld(true);
 }
 function resolveExcess(target,a,minReach,maxReach){
  const delta=target.clone().sub(a);const length=delta.length();
  if(length<1e-7)return;
  if(length>maxReach){moveRoot(delta.multiplyScalar((length-maxReach)*.93/length));}
  else if(length<minReach){moveRoot(delta.multiplyScalar(-(minReach-length)*.85/length));}
 }
 function IK(prefix, limb, target){
  const arm=limb==='arm', upper=bones[prefix+(arm?'UpperArm':'UpperLeg')];
  const lower=bones[prefix+(arm?'LowerArm':'LowerLeg')];
  const end=bones[prefix+(arm?'Hand':'Foot')];
  let a=readWorld(upper).clone();
  const sc=upper.getWorldScale(worldScale),scale=(sc.x+sc.y+sc.z)/3;
  const l1=lower.position.length()*scale,l2=end.position.length()*scale;
  const flex=rad(arm?145:145);
  const minReach=Math.sqrt(Math.max(0,l1*l1+l2*l2+2*l1*l2*Math.cos(flex)))+.002;
  const maxReach=l1+l2-.002;
  resolveExcess(target,a,minReach,maxReach);a=readWorld(upper).clone();
  let toward=target.clone().sub(a);if(toward.lengthSq()<1e-9)return;
  let d=clamp(toward.length(),minReach,maxReach);
  let u=toward.clone().normalize();
  // One-sided anatomical hip extension limit; shoulder has broader socket range.
  const parentQ=readWorldQuat(upper.parent);
  const restWorld=lower.position.clone().normalize().applyQuaternion(parentQ);
  if(arm){
   const maxSwing=rad(164),swing=restWorld.angleTo(u);
   if(swing>maxSwing){
    const q=new THREE.Quaternion().setFromUnitVectors(restWorld,u);
    u=restWorld.applyQuaternion(new THREE.Quaternion().identity().slerp(q,maxSwing/swing)).normalize();
   }
  }else{
   // Restrict HIP flexion/extension and side abduction independently, in the
   // character's local anatomical axes (not global Z after doll is rotated).
   const local=u.clone().applyQuaternion(readWorldQuat(avatar).invert());
   const sagittal=clamp(Math.atan2(local.z,-local.y),rad(-30),rad(120));
   const side=prefix==='Left'?-1:1;
   const lateral=clamp(Math.atan2(side*local.x,Math.hypot(local.y,local.z)),rad(-28),rad(52));
   u.set(side*Math.sin(lateral),-Math.cos(sagittal)*Math.cos(lateral),Math.sin(sagittal)*Math.cos(lateral));
   u.applyQuaternion(readWorldQuat(avatar)).normalize();
  }
  const along=(l1*l1-l2*l2+d*d)/(2*d);
  const sideways=Math.sqrt(Math.max(0,l1*l1-along*along));
  // Elbows bias behind the body; knees point forward.
  const axis=new THREE.Vector3(arm?(prefix==='Left'?-0.18:0.18):0,0,arm?-.98:1)
    .applyQuaternion(readWorldQuat(modelAnchor));
  axis.addScaledVector(u,-axis.dot(u));
  if(axis.lengthSq()<1e-6)axis.set(0,0,1).addScaledVector(u,-u.z);
  axis.normalize();
  const elbowTarget=a.clone().addScaledVector(u,along).addScaledVector(axis,sideways);
  orientTowards(upper,lower,elbowTarget.clone().sub(a));
  const b=readWorld(lower).clone();
  const targetClamped=a.clone().addScaledVector(u,d);
  orientTowards(lower,end,targetClamped.sub(b));
  // Position limits are soft: if a socket bound prevents the end effector from
  // reaching the hand, a small portion of residual force drags the whole doll.
  const residual=target.clone().sub(readWorld(end));
  if(residual.length()>.012)moveRoot(residual.multiplyScalar(.27));
 }
 function directJoint(h,target){
  const b=h.bone;
  if(!b.parent||!b.isBone)return;
  let rotating=null,axis=null;
  if(h.id.endsWith('Elbow'))rotating=b.parent;
  else if(h.id.endsWith('Knee'))rotating=b.parent;
  else if(h.id.endsWith('Shoulder'))rotating=b.parent;
  else if(h.id.endsWith('Thigh'))rotating=b;
  else rotating=b;
  if(rotating===bones.Hips)return;
  const jointWorld=readWorld(rotating).clone();
  const direction=target.clone().sub(jointWorld);
  const child=rotating.children.find(c=>c.isBone);
  if(!child || direction.lengthSq()<1e-5)return;
  orientTowards(rotating,child,direction);
  const limit=rotating.name.includes('UpperLeg')?{x:123,y:45,z:53}:
   rotating.name.includes('UpperArm')?{x:155,y:95,z:155}:{x:65,y:75,z:75};
  clampLocalRotation(rotating,limit);
 }
 function pose(h,target,controllerQuat,hold){
  if(!target || !Number.isFinite(target.x))return;
  if(h.id==='Pelvis'){
   const worldDelta=target.clone().sub(hold.initialJoint);
   const desired=hold.startAnchor.clone().add(worldDelta);
   moveRoot(desired.sub(modelAnchor.position));return;
  }
  if(h.id==='Head'||h.id==='Neck'){
   const b=h.id==='Head'?bones.Head:bones.Neck;
   const delta=controllerQuat.clone().multiply(hold.startCtrlQuat.clone().invert());
   const currentWorld=delta.multiply(hold.startWorldBoneQuat);
   const pQuat=readWorldQuat(b.parent).invert();
   b.quaternion.copy(pQuat.multiply(currentWorld));
   clampLocalRotation(b,h.id==='Head'?HEAD_LIMITS:{x:28,y:42,z:26});
   // Head movement can bend the short neck only slightly; farther translation
   // transfers to whole-body movement when the grip exceeds head mobility.
   const pivot=readWorld(b.parent).clone(),difference=target.clone().sub(pivot);
   const max=readWorld(b).distanceTo(pivot)*1.35;
   if(difference.length()>max && difference.length()>1e-6)
     moveRoot(difference.multiplyScalar((difference.length()-max)/difference.length()*.72));
   return;
  }
  if(h.id==='Chest'){
   const displacement=target.clone().sub(hold.initialJoint);
   const bone=bones.Spine1;const offset=displacement.clone().applyQuaternion(readWorldQuat(bone.parent).invert());
   const e=new THREE.Euler(rad(clamp(offset.z*90,-27,27)),rad(clamp(offset.x*65,-35,35)),rad(clamp(-offset.x*90,-30,30)),'XYZ');
   bone.quaternion.copy(rest.Spine1).multiply(new THREE.Quaternion().setFromEuler(e));return;
  }
  if(h.id.endsWith('Thigh')){
   const side=h.id.startsWith('Left')?'Left':'Right';
   const thigh=bones[side+'UpperLeg'];
   const origin=readWorld(thigh).clone(),vec=target.clone().sub(origin);
   const markerLocal=h.sprite.position.clone();
   const length=markerLocal.length()*thigh.getWorldScale(new THREE.Vector3()).x;
   if(vec.length()>length)moveRoot(vec.clone().multiplyScalar((vec.length()-length)/vec.length()*.80));
   const aim=target.clone().sub(readWorld(thigh));
   if(aim.lengthSq()>1e-7){orientTowards(thigh,{position:markerLocal},aim);
    clampLocalRotation(thigh,{x:120,y:50,z:55});}
   return;
  }
  if(h.mode==='armIK' || h.mode==='legIK'){
   const which=h.id.startsWith('Left')?'Left':'Right';
   IK(which,h.mode==='armIK'?'arm':'leg',target);
   const endpoint=h.bone;
   // Local wrist/ankle orientation follows controller roll/pitch but is capped;
   // the IK solver is responsible for joint translation.
   const delta=controllerQuat.clone().multiply(hold.startCtrlQuat.clone().invert());
   const targetWorldQ=delta.multiply(hold.startWorldBoneQuat);
   endpoint.quaternion.copy(readWorldQuat(endpoint.parent).invert().multiply(targetWorldQ));
   clampLocalRotation(endpoint,h.mode==='armIK'?{x:75,y:75,z:65}:{x:38,y:28,z:25});
   return;
  }
  directJoint(h,target);
 }
 function updateXR(){
  if(!renderer.xr.isPresenting)return;
  const close=new Set();
  for(let i=0;i<2;i++){
   const gp=readWorld(gripNodes[i]).clone();
   for(const h of handles){if(readWorld(h.sprite).distanceTo(gp)<.20)close.add(h);}
  }
  for(const v of holds.values())close.add(v.h);
  for(const h of handles)h.sprite.visible=close.has(h);
  for(const [i,hold] of holds){
   const cp=readWorld(gripNodes[i]).clone();
   const delta=cp.sub(hold.initialController);
   const target=hold.initialJoint.clone().add(delta);
   pose(hold.h,target,readWorldQuat(gripNodes[i]),hold);
  }
 }
 // Desktop pose testing: click a ring, drag in a camera-facing plane.
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane();
 const mouseStartHit=new THREE.Vector3(),mouseHit=new THREE.Vector3();
 function rayEvent(ev){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(((ev.clientX-rect.left)/rect.width)*2-1,-((ev.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(pointer,camera);return raycaster.ray;
 }
 function pointerDown(ev){
  if(renderer.xr.isPresenting||ev.button!==0)return;
  rayEvent(ev);
  const hits=raycaster.intersectObjects(handles.map(h=>h.sprite),false);
  const h=hits.length?handles.find(h=>h.sprite===hits[0].object):null;
  if(!h)return;
  const j=jointFor(h),p=readWorld(j).clone();
  plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(cameraForward),p);
  if(!raycaster.ray.intersectPlane(plane,mouseStartHit))return;
  mouseHold=makeHold(h,mouseStartHit,new THREE.Quaternion());
  controls.enabled=false;renderer.domElement.setPointerCapture(ev.pointerId);
  ev.preventDefault();
 }
 function pointerMove(ev){
  if(!mouseHold)return;rayEvent(ev);
  if(!raycaster.ray.intersectPlane(plane,mouseHit))return;
  const target=mouseHold.initialJoint.clone().add(mouseHit.clone().sub(mouseStartHit));
  pose(mouseHold.h,target,new THREE.Quaternion(),mouseHold);
 }
 function pointerUp(){mouseHold=null;controls.enabled=true;}
 renderer.domElement.addEventListener('pointerdown',pointerDown);
 renderer.domElement.addEventListener('pointermove',pointerMove);
 renderer.domElement.addEventListener('pointerup',pointerUp);
 renderer.domElement.addEventListener('pointercancel',pointerUp);
 function reset(){holds.clear();mouseHold=null;Object.keys(bones).forEach(name=>bones[name].quaternion.copy(rest[name]));}
 function update(){avatar.updateMatrixWorld(true);if(renderer.xr.isPresenting)updateXR();else{
   for(const h of handles)h.sprite.visible=true;
 }}
 renderer.xr.addEventListener('sessionend',()=>{holds.clear();});
 return {update,reset,releaseAll:()=>holds.clear(),bones,handles};
}
