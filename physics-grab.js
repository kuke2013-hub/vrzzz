import * as THREE from 'three';
import RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs';

// No floor, gravity, collision stage or rendered scenery. A fixed collider
// tracks Zelda's pose while idle, and turns kinematic only during gripping.
export async function createGrabPhysics({renderer, rig, modelAnchor, onStatus}) {
  await RAPIER.init();
  const world = new RAPIER.World({x:0, y:0, z:0});
  world.timestep = 1 / 60;

  let body = null, collider = null, baseHalf = new THREE.Vector3(0.84,0.40,0.62);
  let objectScale = 1, accumulator = 0, heldMode = 'none';
  const localBox = new THREE.Box3();
  const handPos = new THREE.Vector3(), handQuat = new THREE.Quaternion();
  const tempPosition = new THREE.Vector3(), tempQuat = new THREE.Quaternion();
  const targetPosition = new THREE.Vector3(), targetQuat = new THREE.Quaternion();
  const lastPosition = new THREE.Vector3(), lastQuat = new THREE.Quaternion();
  const throwLinear = new THREE.Vector3(), throwAngular = new THREE.Vector3();
  const deltaQuat = new THREE.Quaternion(), rotationAxis = new THREE.Vector3();
  const handRay = new THREE.Ray(), rayIntersection = new THREE.Vector3();
  const offset = new THREE.Vector3(), offsetQuat = new THREE.Quaternion();
  const mid = new THREE.Vector3(), line = new THREE.Vector3(), rotationDelta = new THREE.Quaternion();
  const relativeOffset = new THREE.Vector3();
  let twoStartDistance = 1, twoStartScale = 1;
  const twoStartLine = new THREE.Vector3(), twoStartQuat = new THREE.Quaternion(), twoStartOffset = new THREE.Vector3();
  // Two-hand mode uses the right controller for wrist-roll priority. Hand spacing
  // sets scale; hand-to-hand direction provides swing; the right grip adds twist.
  const twoStartRightQuat = new THREE.Quaternion();
  const rightExpectedQuat = new THREE.Quaternion(), rightResidualQuat = new THREE.Quaternion();
  const twoHandTwist = new THREE.Quaternion(), twoHandFrame = new THREE.Quaternion();
  const rightTwistAxis = new THREE.Vector3();
  const holdPosition = new THREE.Vector3(), holdQuat = new THREE.Quaternion();
  const lastHeldQuat = new THREE.Quaternion();
  let lastSampleValid = false;
  // Store yaw steps in the grip-relative orientation, NOT as a world-space
  // quaternion applied after hand tracking. The old world-space premultiply
  // rotated the *axis of later wrist motion* by the accumulated snap angle.
  const worldUp = new THREE.Vector3(0,1,0);
  const yawStep = new THREE.Quaternion();
  const snapFrameTurn = new THREE.Quaternion();
  const snapHandA = new THREE.Vector3(), snapHandB = new THREE.Vector3();
  const snapHandQA = new THREE.Quaternion(), snapHandQB = new THREE.Quaternion();

  // Register both target-ray events (squeeze button) and grip-space transforms.
  // Do not infer left/right from XR input source enumeration order.
  const hands = [0,1].map(i => {
    const grip = renderer.xr.getControllerGrip(i);
    const controller = renderer.xr.getController(i);
    rig.add(grip);
    rig.add(controller);
    const hand = {index:i, grip, controller, source:null, pressed:false, active:false, snapReady:true};
    controller.addEventListener('connected', e => {hand.source=e.data;});
    controller.addEventListener('disconnected', () => {setPressed(hand,false);hand.source=null;});
    controller.addEventListener('squeezestart', () => setPressed(hand,true));
    controller.addEventListener('squeezeend', () => setPressed(hand,false));
    return hand;
  });

  function activeHands() {return hands.filter(h=>h.active);}
  function twoHandPair() {
    const active=activeHands();
    if(active.length!==2)return null;
    // Do not assume that WebXR's input-source enumeration is left then right.
    const right=active.find(h=>h.source?.handedness==='right')||active[1];
    const left=active.find(h=>h!==right && h.source?.handedness==='left')
      ||active.find(h=>h!==right);
    return [left,right];
  }
  function readTwoHandFrame(pa,pb,qa,qb) {
    const pair=twoHandPair();
    if(!pair)return null;
    handTransform(pair[0],pa,qa);
    handTransform(pair[1],pb,qb);
    line.subVectors(pb,pa);
    const distance=Math.max(0.035,line.length());
    if(line.lengthSq()>1e-8)line.normalize();
    else line.copy(twoStartLine);
    // Swing the model as the hand-to-hand line changes, as in v6.
    rotationDelta.setFromUnitVectors(twoStartLine,line);
    // A purely swinging right hand would have this orientation. Only the
    // residual wrist roll (around the controller's forward axis) is applied,
    // so moving hands around does not double-count the swing rotation.
    rightExpectedQuat.copy(rotationDelta).multiply(twoStartRightQuat);
    rightTwistAxis.set(0,0,-1).applyQuaternion(rightExpectedQuat).normalize();
    rightResidualQuat.copy(qb).multiply(rightExpectedQuat.clone().invert()).normalize();
    const projected=rightResidualQuat.x*rightTwistAxis.x
      +rightResidualQuat.y*rightTwistAxis.y
      +rightResidualQuat.z*rightTwistAxis.z;
    twoHandTwist.set(rightTwistAxis.x*projected,rightTwistAxis.y*projected,
      rightTwistAxis.z*projected,rightResidualQuat.w);
    if(twoHandTwist.lengthSq()<1e-10)twoHandTwist.identity();
    else twoHandTwist.normalize();
    twoHandFrame.copy(twoHandTwist).multiply(rotationDelta).normalize();
    return distance;
  }
  function handTransform(hand, position, quaternion) {
    hand.grip.updateWorldMatrix(true,false);
    hand.grip.getWorldPosition(position);
    hand.grip.getWorldQuaternion(quaternion);
  }
  function syncAnchorFromBody() {
    if(!body)return;
    const p=body.translation(), q=body.rotation();
    modelAnchor.position.set(p.x,p.y,p.z);
    modelAnchor.quaternion.set(q.x,q.y,q.z,q.w);
  }
  function changeScale(next) {
    next=THREE.MathUtils.clamp(next,0.25,3.5);
    if(Math.abs(next-objectScale)<0.003)return;
    objectScale=next;
    modelAnchor.scale.setScalar(objectScale);
    if(collider) collider.setShape(new RAPIER.Cuboid(
      Math.max(0.015,baseHalf.x*objectScale),
      Math.max(0.015,baseHalf.y*objectScale),
      Math.max(0.015,baseHalf.z*objectScale)));
  }
  function canGrab(hand) {
    if(!body || !renderer.xr.isPresenting)return false;
    handTransform(hand,handPos,handQuat);
    modelAnchor.updateWorldMatrix(true,false);
    const localHand=modelAnchor.worldToLocal(handPos.clone());
    const nearest=localBox.clampPoint(localHand,new THREE.Vector3());
    if(nearest.distanceTo(localHand)*objectScale < 0.38)return true;
    // Also permit aiming at Zelda from short range; no visual pointer is drawn.
    handRay.origin.copy(handPos);
    handRay.direction.set(0,0,-1).applyQuaternion(handQuat).normalize();
    const localRay=handRay.clone().applyMatrix4(modelAnchor.matrixWorld.clone().invert());
    const intersection=localRay.intersectBox(localBox,rayIntersection);
    return !!intersection && intersection.distanceTo(localRay.origin)*objectScale <= 3.0;
  }
  function beginOne(hand) {
    heldMode='one';
    handTransform(hand,handPos,handQuat);
    offset.copy(modelAnchor.position).sub(handPos).applyQuaternion(handQuat.clone().invert());
    offsetQuat.copy(handQuat).invert().multiply(modelAnchor.quaternion);
    lastPosition.copy(modelAnchor.position);lastQuat.copy(modelAnchor.quaternion);
    lastSampleValid=false;
  }
  function beginTwo() {
    const pair=twoHandPair();
    if(!pair)return;
    const pa=new THREE.Vector3(),pb=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
    handTransform(pair[0],pa,qa);handTransform(pair[1],pb,qb);
    mid.copy(pa).add(pb).multiplyScalar(0.5);
    line.subVectors(pb,pa);
    twoStartDistance=Math.max(0.10,line.length());
    twoStartLine.copy(line).normalize();
    twoStartRightQuat.copy(qb); // Neutral wrist roll at the precise grab instant.
    twoStartScale=objectScale;
    twoStartQuat.copy(modelAnchor.quaternion);
    twoStartOffset.copy(modelAnchor.position).sub(mid);
    heldMode='two';
    lastPosition.copy(modelAnchor.position);lastQuat.copy(modelAnchor.quaternion);
    lastSampleValid=false;
  }
  function setPressed(hand, pressed) {
    if(pressed===hand.pressed && (!pressed || hand.active))return;
    hand.pressed=pressed;
    if(!pressed) {
      hand.snapReady=true;
      if(!hand.active)return;
      hand.active=false;
      const remaining=activeHands();
      if(remaining.length===1)beginOne(remaining[0]);
      else if(!remaining.length)freezeReleasedModel();
      return;
    }
    if(!canGrab(hand))return;
    const wasEmpty=activeHands().length===0;
    if(wasEmpty) {
      syncAnchorFromBody();
      body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
      body.setLinvel({x:0,y:0,z:0},true);
      body.setAngvel({x:0,y:0,z:0},true);
      throwLinear.set(0,0,0);throwAngular.set(0,0,0);
    }
    hand.active=true;
    hand.snapReady=true;
    if(activeHands().length===2) {
      beginTwo();
      onStatus('Two-hand grab: spread hands to enlarge Zelda, bring them together to shrink, and twist the RIGHT wrist to roll her at the same time.');
    } else {
      beginOne(hand);
      onStatus('Zelda grabbed. Thumbstick X rotates 30°, Y walks forward/back. Release grip to leave Zelda floating in place.');
    }
  }
  // Zero gravity / frozen release: when the final grip is released,
  // Zelda becomes a fixed body exactly at her last held world-space pose.
  // No falling, throwing, bouncing, drifting or further spin.
  function freezeReleasedModel() {
    if(!body || heldMode==='none')return;
    heldMode='none';
    const p=modelAnchor.position, q=modelAnchor.quaternion;
    body.setTranslation({x:p.x,y:p.y,z:p.z},true);
    body.setRotation({x:q.x,y:q.y,z:q.z,w:q.w},true);
    body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
    body.setLinvel({x:0,y:0,z:0},true);
    body.setAngvel({x:0,y:0,z:0},true);
    throwLinear.set(0,0,0);throwAngular.set(0,0,0);
    lastSampleValid=false;
    onStatus('Zelda released: frozen exactly in place, with no gravity or momentum.');
  }
  function moveGrabbed(dt) {
    const group=activeHands();
    if(!group.length)return;
    if(group.length===1) {
      handTransform(group[0],handPos,handQuat);
      targetPosition.copy(offset).applyQuaternion(handQuat).add(handPos);
      targetQuat.copy(handQuat).multiply(offsetQuat);
    } else {
      const pa=new THREE.Vector3(),pb=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
      const distance=readTwoHandFrame(pa,pb,qa,qb);
      if(distance===null)return;
      mid.copy(pa).add(pb).multiplyScalar(0.5);
      const ratio=distance/twoStartDistance;
      changeScale(twoStartScale*ratio);
      targetQuat.copy(twoHandFrame).multiply(twoStartQuat);
      // Pivot about the hand midpoint; roll should also rotate Zelda's offset,
      // not just her orientation, so she remains centred between the hands.
      targetPosition.copy(twoStartOffset).multiplyScalar(objectScale/twoStartScale)
        .applyQuaternion(twoHandFrame).add(mid);
    }
    // Every snap is already baked into the grip-relative offset. The hand's
    // tracked orientation acts first, so physical wrist twist stays one-to-one.
    // No ground clamping: release must preserve the exact position and
    // orientation the user chose, including suspended and upside-down poses.
    modelAnchor.position.copy(targetPosition);
    modelAnchor.quaternion.copy(targetQuat);
    body.setNextKinematicTranslation(targetPosition);
    body.setNextKinematicRotation(targetQuat);
    if(lastSampleValid && dt>0.002) {
      const v=tempPosition.subVectors(targetPosition,lastPosition).multiplyScalar(1/dt).clampLength(0,8);
      throwLinear.lerp(v,0.5);
      deltaQuat.copy(targetQuat).multiply(lastQuat.clone().invert()).normalize();
      if(deltaQuat.w<0)deltaQuat.set(-deltaQuat.x,-deltaQuat.y,-deltaQuat.z,-deltaQuat.w);
      const angle=2*Math.acos(THREE.MathUtils.clamp(deltaQuat.w,-1,1));
      const axisSize=Math.sqrt(Math.max(0,1-deltaQuat.w*deltaQuat.w));
      if(axisSize>0.0001 && angle<Math.PI) {
        rotationAxis.set(deltaQuat.x,deltaQuat.y,deltaQuat.z).multiplyScalar(angle/(axisSize*dt));
        throwAngular.lerp(rotationAxis.clampLength(0,14),0.5);
      }
    }
    lastPosition.copy(targetPosition);lastQuat.copy(targetQuat);
    lastSampleValid=true;
  }
  function attachModel(size) {
    hands.forEach(h=>{h.active=false;h.pressed=false;h.snapReady=true;});
    heldMode='none';
    if(body) {world.removeRigidBody(body);body=null;collider=null;}
    baseHalf.copy(size).multiplyScalar(0.5);
    objectScale=1;
    modelAnchor.scale.setScalar(1);
    modelAnchor.position.set(0,baseHalf.y,-2.0);
    modelAnchor.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    localBox.min.copy(baseHalf).multiplyScalar(-1);
    localBox.max.copy(baseHalf);
    const p=modelAnchor.position,q=modelAnchor.quaternion;
    // Start stationary in midair rather than letting Zelda fall before grabbing.
    body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
      .setTranslation(p.x,p.y,p.z)
      .setRotation({x:q.x,y:q.y,z:q.z,w:q.w}));
    collider=world.createCollider(RAPIER.ColliderDesc.cuboid(baseHalf.x,baseHalf.y,baseHalf.z),body);
    throwLinear.set(0,0,0);throwAngular.set(0,0,0);
    lastSampleValid=false;
  }
  function releaseAll() {
    hands.forEach(h=>{h.active=false;h.pressed=false;h.snapReady=true;});
    if(body && heldMode!=='none') {
      heldMode='none';
      body.setTranslation(modelAnchor.position,true);
      body.setRotation(modelAnchor.quaternion,true);
      body.setBodyType(RAPIER.RigidBodyType.Fixed,true);
      body.setLinvel({x:0,y:0,z:0},true);
      body.setAngvel({x:0,y:0,z:0},true);
    }
    lastSampleValid=false;
  }
  function reset() {
    releaseAll();
    if(!body)return;
    changeScale(1);
    modelAnchor.position.set(0,baseHalf.y,-2);
    modelAnchor.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
    body.setTranslation(modelAnchor.position,true);
    body.setRotation(modelAnchor.quaternion,true);
    body.setLinvel({x:0,y:0,z:0},true);
    body.setAngvel({x:0,y:0,z:0},true);
    throwLinear.set(0,0,0);throwAngular.set(0,0,0);
  }
  function pollGrips() {
    if(!renderer.xr.isPresenting || !body)return;
    // WebXR squeeze events normally drive this; gamepad state is the fallback.
    // Running this before movement prevents a simultaneous grip+stick action
    // from briefly moving the player instead of manipulating the held model.
    for(const hand of hands) {
      const button=hand.source?.gamepad?.buttons?.[1];
      if(!button)continue;
      const pressed=!!(button.pressed || button.value>0.65);
      if(hand.pressed!==pressed)setPressed(hand,pressed);
      else if(pressed && !hand.active)setPressed(hand,true);
    }
  }
  function isHolding(handedness) {
    return hands.some(hand=>hand.active && hand.source?.handedness===handedness);
  }
  function stickX(gamepad) {
    const a=gamepad?.axes||[];
    const valid=(x,y)=>Number.isFinite(a[x])&&Number.isFinite(a[y]);
    const primary=valid(2,3)?{x:a[2],y:a[3]}:null;
    const secondary=valid(0,1)?{x:a[0],y:a[1]}:null;
    if(primary && (Math.abs(primary.x)>.12||Math.abs(primary.y)>.12))return primary.x;
    if(secondary && (Math.abs(secondary.x)>.12||Math.abs(secondary.y)>.12))return secondary.x;
    return (primary||secondary||{x:0}).x;
  }
  function snapHeldModel(direction) {
    // World-up 30° yaw at the instant of input; then express that same
    // rotation in the hand's CURRENT frame. This makes subsequent wrist
    // roll/pitch/yaw affect Zelda on the same axes as the physical controller.
    yawStep.setFromAxisAngle(worldUp,direction*Math.PI/6);
    if(heldMode==='one') {
      const hand=activeHands()[0];
      if(!hand)return false;
      handTransform(hand,handPos,handQuat);
      // Q = H * O. Want Q' = Y * Q, so O' = inverse(H) * Y * H * O.
      snapFrameTurn.copy(handQuat).invert().multiply(yawStep).multiply(handQuat);
      offsetQuat.premultiply(snapFrameTurn).normalize();
      return true;
    }
    if(heldMode==='two') {
      if(readTwoHandFrame(snapHandA,snapHandB,snapHandQA,snapHandQB)===null)return false;
      // Q = F * twoStartQuat, where F combines interhand swing with right-hand
      // wrist roll. Bake joystick yaw into that full frame to avoid twisting
      // the wrist axis or losing the 30-degree snap after a wrist movement.
      snapFrameTurn.copy(twoHandFrame).invert().multiply(yawStep).multiply(twoHandFrame);
      twoStartQuat.premultiply(snapFrameTurn).normalize();
      return true;
    }
    return false;
  }
  function updateHeldThumbsticks() {
    for(const hand of hands) {
      if(!hand.active || !hand.source?.gamepad) {
        hand.snapReady=true;
        continue;
      }
      const x=stickX(hand.source.gamepad);
      if(Math.abs(x)<.30) {
        hand.snapReady=true; // Must centre the stick before the next turn.
        continue;
      }
      if(hand.snapReady && Math.abs(x)>.70) {
        hand.snapReady=false;
        const direction=x>0?1:-1;
        if(!snapHeldModel(direction))continue;
        // Avoid interpreting discrete stick snaps as wrist motion.
        throwAngular.set(0,0,0);
        lastSampleValid=false;
        onStatus('Zelda rotated 30° '+(direction>0?'right':'left')+'. Centre the held-hand joystick for another step.');
      }
    }
  }
  function update(dt) {
    if(!body)return;
    if(renderer.xr.isPresenting) {
      pollGrips();
      updateHeldThumbsticks();
      if(activeHands().length)moveGrabbed(dt);
    }
    accumulator+=Math.min(Math.max(dt,0),0.05);
    let steps=0;
    while(accumulator>=1/60 && steps<3) {world.step();accumulator-=1/60;steps++;}
    if(!activeHands().length)syncAnchorFromBody();
  }

  renderer.xr.addEventListener('sessionend',releaseAll);
  return {attachModel,update,reset,releaseAll,pollGrips,isHolding};
}
