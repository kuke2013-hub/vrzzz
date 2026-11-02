# Zelda · Quest 3 mixed reality

**Current version: 11.2 — Grab Zelda from any visible distance; preserve 10%–350% linear resizing and all controls.** [See version history](VERSIONS.md).
The app displays its current version beneath the title on the live page; each
subsequent update should bump the displayed number and add a history entry.

Open in Meta Quest Browser: https://kuke2013-hub.github.io/vrzzz/

## Environment

Only the Zelda model is drawn in the WebXR immersive-AR passthrough session.
There is no virtual floor, grid, scenery, contact shadow or floor collision.
**Gravity is disabled.** When the final side-grip button is released, Zelda is
converted to a fixed pose and **remains exactly where she was positioned**,
including in mid-air or upside down. She does not fall, bounce, drift or spin.

## Quest 3 controller mapping

| Control | While Zelda is NOT held | While THIS controller's side grip holds Zelda |
|---|---|---|
| Left thumbstick forward/back | **Pull Zelda closer / push Zelda farther** | **Same pull/push** (does not walk the viewer) |
| Left thumbstick left/right | **Move Zelda left/right** | **Move Zelda left/right** (never player strafe) |
| Right thumbstick forward/back | **Pull Zelda closer / push Zelda farther** | **Same pull/push** (does not walk the viewer) |
| Right thumbstick left/right | Turn viewpoint 30° | **Rotate Zelda 30° left/right**, not the viewpoint |
| Side grip (squeeze button) | Grab Zelda when near, or aim + squeeze at any visible distance | Keep Zelda attached to the hand |
| Release last side grip | — | Freeze Zelda's exact position, scale and rotation |
| Both grips simultaneously | — | Spread/close hands for **linear resize (10%–350%)** and use right-wrist pitch + roll |

Right horizontal thumbstick movements rotate Zelda one **30° increment** per tilt while the right grip is held. Return
the stick toward centre before each subsequent increment. The left horizontal thumbstick now translates Zelda sideways. Horizontal rotation and
depth movement are independent: use both axes simultaneously. Both vertical
stick axes operate Zelda's depth at all times, whether or not a grip is held.
If both are active, the stronger stick deflection wins (right on equal strength),
so they never double Zelda's travel speed.

With two-hand grabbing, Zelda scales linearly from **10% to 350%** of the source size, based on relative hand separation.
In **version 8.0**, the right controller has priority for both up/down wrist pitch (local X) and left/right wrist roll (local Z).
The direction between the hands controls the model's overall swing; tilting
the right wrist up/down supplies pitch, twisting around its pointing axis
supplies roll, and hand separation independently controls scale. This works during continuous
size changes and while using the existing 30° thumbstick model rotations.
A quaternion swing–twist decomposition excludes only local-Y wrist yaw to
avoid double-counting the hand-line swing; it preserves the other two axes.
The right hand is detected by the WebXR `handedness` field, not by controller
enumeration order. Switching from one to two hands records a neutral twist
reference to avoid a sudden jump; releasing one hand returns smoothly to the
remaining hand's orientation. The model is still frozen in place on release.
The source is already a crouched, human-length figure, approximately 1.67m
long and 0.8m high; it must not be vertically stretched into a standing figure.

Grab uses the *side grip/squeeze* button, not the index trigger or thumbstick
click. You can reach near the model or aim at it from up to 3m to initiate the
grab, depending on your controller tracking. Zelda can be physically repositioned
and rotated by moving a held controller as well as by thumbstick yaw.

Version 6 corrects the snap-turn/wrist interaction: each 30° world-up rotation
is baked into the current grab-relative offset instead of being layered over
the controller's live pose. Wrist twisting therefore stays aligned with the
tracked controller after repeated snaps, while the other controls are retained.

## Version 11.0: original resizing restrictions restored

The working original limit is **25% minimum / 350% maximum**, with **linear**
two-hand hand-spacing control. There is no fourth-power enlargement and no
micro-dot or giant-building scaling. Right-wrist pitch/roll, thumbstick model
movement, 30° right-hand model turns, passthrough and stationary release remain
unchanged. The v10.1 intermediate release briefly used a 10% minimum; v11.0
corrects it back to the original 25%.

## Version 11.2: distance-unlimited remote grip

The controller pointing ray no longer has a 3m distance cap. Aim at Zelda
and squeeze either controller's side grip to pick her up from any
visible/renderable distance. Near-hand grabbing still works. The model
keeps its position when you begin holding it, so you can use the existing
thumbstick pull/push controls to bring it closer afterward. The pointing
ray must intersect the model, and WebXR precision/rendering limits still
apply. Resizing remains linear at 10%–350%; all other controls are unchanged.

## Version 10.1: restored resizing range (historical)

Two-hand resizing has reverted to the familiar **linear hand-spacing response**, now limited to **0.10×–3.50×** the original model. The extreme nonlinear scaling introduced in Version 10 was removed. All of the left-stick sideways translation, both-stick pull/push, right-stick rotations, two-hand right-wrist pitch/roll, and gravity-free release remain in place.

## Version 10 extreme resizing and horizontal model movement (historical; resizing superseded in 10.1)

Version 10 previously used an experimental extreme range, **reverted in Version 10.1**. The scaling range was **finite rather than literally infinite**, due to WebXR
and floating-point limitations. Two-hand grip resizing now supports 0.00001×
to 10,000×, a one-billion-fold range. It uses the fourth power of the
relative hand-distance change, so a moderate arm stretch can reach
building-sized models. Releasing and regrabbing can extend it further.

The model's centre no longer flies away as it grows; it stays close to the
original grip-relative centre while its own geometry expands. No Rapier
collider is constructed for these enormous sizes, since gravity and
collisions were previously disabled. View distance extends to 50,000m.
For giant models, the joystick push/pull speed scales with model size so
you can reposition them far enough away to see.

**Left stick left/right moves Zelda left/right** relative to the direction
you are facing, whether holding either grip or holding none. It no longer
strafes the user and no longer rotates Zelda when the left grip is held.
Right stick left/right still rotates Zelda 30° with the right grip and
turns your viewpoint without that grip. Both vertical sticks retain the
Version 9 model pull/push control.

The Quest headset might lose precision, clipping or easy picking at
extreme scales. Use **Reset view and Zelda** to return to normal.

## Version 9 model depth control

**Pull either thumbstick BACK (Y positive): Zelda moves toward the headset.**
**Push either thumbstick FORWARD (Y negative): Zelda moves away from the headset.**
The model, not the viewpoint/player, is translated. This works with **zero, one
or two grip buttons pressed**, and can operate while the hand is twisting,
resizing or making 30° model rotation steps. Travel speed is 1.4 metres/second at normal size and scales up with a gigantic model; the permitted distance from the headset is 0.6–50,000m.
The direction is recomputed from Zelda toward the current headset position so
pulling feels like drawing the character towards you. With a held grip, model
depth travel is stored as a separate offset applied after hand tracking so it
cannot snap back on the next frame. When grip modes change, that offset is
incorporated into the new grab baseline to prevent double travel.

The horizontal left stick now moves Zelda left/right even while gripping. The right stick still snap-turns the viewpoint when unheld and rotates Zelda 30° while the right grip is held. No thumbstick moves the player in Quest mode.

## Publishing and implementation

The version is shown **in the main page heading, below it, and in the footer**.
The main page is `index.html`; for Quest browsers still displaying an older
cached home page, open the explicit [Version 11 page](v11.html) at
`https://kuke2013-hub.github.io/vrzzz/v11.html`. Both current entry points load
`app.js?v=11` and `physics-grab.js?v=11` after GitHub Pages publishes.
A URL query string alone does not prove a new deploy has taken effect.

The site is a static GitHub Pages app (branch `main`, directory `/(root)`).
It requires HTTPS, WebXR `immersive-ar` and the `local-floor` reference
space in Quest Browser.

* `index.html`: controls and WebXR launch.
* `app.js`: GLB loading, headset-relative locomotion, stick input routing.
* `physics-grab.js`: Rapier-backed grab, dual-hand scale, 30° held-object yaw,
  kinematic hand following and fixed-pose release; zero gravity, no floor collider.
* `assets/zelda.glb`: optimised character mesh and embedded textures.

The left thumbstick X now moves Zelda left/right, even if a grip is held; the right stick still snap-turns the viewpoint if unheld. **No Quest thumbstick axis moves the user.**

Hardware limitation: actual controller tracking, squeeze events, passthrough
compositing and simultaneous diagonals must be checked in a physical Meta Quest 3.
A source-code check cannot prove headset behaviour.
