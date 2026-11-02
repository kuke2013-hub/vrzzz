# Zelda · Quest 3 Mixed Reality (grab / rotate / scale / freeze)

Live site (when GitHub Pages is enabled for main / root):
https://kuke2013-hub.github.io/vrzzz/

The **real-world camera passthrough is the only background** in Quest 3.
No virtual flooring, grid, ring, shadow catcher, controller markers or scenery is
rendered. Rapier gravity is zero, and Zelda's rigid body becomes **fixed** when you release it. An invisible y=0 collider is retained for positioning while held. The model therefore remains suspended at the precise point and angle of release rather than falling.

## Controls

| Quest 3 control | Action |
| --- | --- |
| Left thumbstick forward/back | Walk relative to headset forward direction **even while holding Zelda with the left grip** |
| Left thumbstick sideways, when left grip is **not** holding Zelda | Step left or right; when holding with the left grip, sideways rotates **Zelda** in 30° steps |
| Right thumbstick sideways, when right grip is **not** holding Zelda | Snap-turn the scene 30°; center stick before next turn |
| Left **side grip / squeeze** near Zelda, or aiming at her | Pick up and rotate the whole model while holding the button |
| **Thumbstick left/right on whichever controller is gripping Zelda** | Rotate **Zelda**, not your view, 30° per tilt; recenter to re-arm |
| Release the last side grip | Freeze Zelda immediately at her current world-space location, size and rotation; **no gravity, fall, bounce, or momentum** |
| Hold **both side grips** on Zelda | Two-hand scaling: stretch hands apart to enlarge, move closer to shrink; simultaneously reorient and reposition |
| Release one of two grips | Continue holding with the other hand without teleporting |
| Reset view and Zelda | Reset position, rotation, linear/angular velocity and scale |

Scaling range: **0.25× to 3.5×** the original human scale. The physics collision
shape is resized together with the visible GLB; frozen objects keep the new collision size. The model is a crouched human-size
pose: around 1.67m long and approximately 0.8m high, rather than a standing
1.67m-tall character.

**Important interaction:** The side buttons are the Quest Touch controller
**grip/squeeze buttons**, not the index-finger triggers or the joystick clicks.
The hand must touch/approach the model, or point at it within 3m to begin a
grab. Once two grips are holding it, hand spacing controls size. Either held hand's thumbstick can also snap Zelda's yaw by 30°. Model rotation remains applied while you continue moving your hand. When the **left** grip is active, the **left thumbstick Y axis still moves you forward and backward**; only its X axis is reassigned to Zelda rotation. Releasing the grip restores normal sideways strafing and/or viewpoint turning. Physics uses a cuboid collision envelope around Zelda, but **no dynamic falling or ragdoll simulation runs after release**.

## Deployment

Open GitHub → repository **Settings → Pages** and choose **Deploy from a branch**,
branch **main**, folder **/(root)**, then Save. Quest Browser requires HTTPS and
WebXR **immersive-ar** with **local-floor** enabled.

## Project

* index.html — WebXR entry UI, desktop preview.
* app.js — model load (single 11,668,312-byte GLB, with eight split-part
  fallback), calibrated human scale, headset-relative locomotion and snap turn.
* physics-grab.js — zero-gravity Rapier world, fixed-body release, invisible ground
  collider, side-grip grabbing, dual-hand scaling and orientation,
  30° held-model thumbstick yaw with per-hand rearm thresholds.
* assets/zelda.glb — Quest-optimised GLB embedded material textures.

Physics is computed locally in the Quest browser; no backend or paid API is
required. The scene uses Three.js r186, Rapier 0.21 and standard WebXR controller
squeeze events (with gamepad grip-button fallback).

## Testing

Desktop browsers can inspect the scene and use orbit/WASD. Real passthrough
video, physical controller grips, simultaneous walking/grabbing, two-hand scaling,
and stationary release **must be tested on Meta Quest 3**; standard desktop tests do not verify headset-specific
WebXR behaviour. If your real floor height appears wrong, recenter the Quest
headset guardian/floor calibration. The invisible floor is a *flat plane* at
the WebXR local-floor zero height; there is no room mesh detection.
