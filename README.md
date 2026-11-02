# Zelda · Quest 3 Mixed Reality (grab / throw / scale)

Live site (when GitHub Pages is enabled for main / root):
https://kuke2013-hub.github.io/vrzzz/

The **real-world camera passthrough is the only background** in Quest 3.
No virtual flooring, grid, ring, shadow catcher, controller markers or scenery is
rendered. A Rapier collision floor exists only in the physics simulation at y=0
so Zelda can fall, roll and bounce off the floor while the real room stays visible.

## Controls

| Quest 3 control | Action |
| --- | --- |
| Left thumbstick forward/back | Walk relative to headset forward direction |
| Left thumbstick sideways | Step left or right |
| Right thumbstick sideways | Snap-turn the scene 30°; center stick before next turn |
| Left **side grip / squeeze** near Zelda, or aiming at her | Pick up and rotate the whole model while holding the button |
| Release the last side grip | Throw / drop; gravity, collision, inertia and bounce resume |
| Hold **both side grips** on Zelda | Two-hand scaling: stretch hands apart to enlarge, move closer to shrink; simultaneously reorient and reposition |
| Release one of two grips | Continue holding with the other hand without teleporting |
| Reset view and Zelda | Reset position, rotation, linear/angular velocity and scale |

Scaling range: **0.25× to 3.5×** the original human scale. The physics collision
shape is resized together with the visible GLB; throwing a larger or smaller
character still uses the new collision size. The model is a crouched human-size
pose: around 1.67m long and approximately 0.8m high, rather than a standing
1.67m-tall character.

**Important interaction:** The side buttons are the Quest Touch controller
**grip/squeeze buttons**, not the index-finger triggers or the joystick clicks.
The hand must touch/approach the model, or point at it within 3m to begin a
grab. Once two grips are holding it, hand spacing controls size. Physics uses a
cuboid envelope around the character, so collision is approximate rather than
per-vertex, and bouncing is visibly stylized rather than a ragdoll simulation.

## Deployment

Open GitHub → repository **Settings → Pages** and choose **Deploy from a branch**,
branch **main**, folder **/(root)**, then Save. Quest Browser requires HTTPS and
WebXR **immersive-ar** with **local-floor** enabled.

## Project

* index.html — WebXR entry UI, desktop preview.
* app.js — model load (single 11,668,312-byte GLB, with eight split-part
  fallback), calibrated human scale, headset-relative locomotion and snap turn.
* physics-grab.js — Rapier 3D physics, invisible ground collider, side-grip
  grabbing and throwing, dual-hand geometric scaling and orientation.
* assets/zelda.glb — Quest-optimised GLB embedded material textures.

Physics is computed locally in the Quest browser; no backend or paid API is
required. The scene uses Three.js r186, Rapier 0.21 and standard WebXR controller
squeeze events (with gamepad grip-button fallback).

## Testing

Desktop browsers can inspect the scene and use orbit/WASD. Real passthrough
video, physical controller grips, two-hand tracking, and throw feel **must be
tested on Meta Quest 3**; standard desktop tests do not verify headset-specific
WebXR behaviour. If your real floor height appears wrong, recenter the Quest
headset guardian/floor calibration. The invisible floor is a *flat plane* at
the WebXR local-floor zero height; there is no room mesh detection.
