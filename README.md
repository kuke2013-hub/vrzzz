# Zelda · Quest 3 mixed reality

**Current version: 8.0 — Two-hand right-wrist pitch AND roll while resizing.** [See version history](VERSIONS.md).
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
| Left thumbstick forward/back | Walk forward/back | **Continue walking forward/back** |
| Left thumbstick left/right | Strafe | **Rotate Zelda 30° left/right** |
| Right thumbstick forward/back | No assigned action | **Walk forward/back** |
| Right thumbstick left/right | Turn viewpoint 30° | **Rotate Zelda 30° left/right**, not the viewpoint |
| Side grip (squeeze button) | Grab Zelda when near or aiming at her | Keep Zelda attached to the hand |
| Release last side grip | — | Freeze Zelda's exact position, scale and rotation |
| Both grips simultaneously | — | Spread/close hands to scale Zelda; pitch the **right wrist up/down** and roll it **left/right**, simultaneously |

Horizontal stick movements rotate Zelda one **30° increment** per tilt. Return
the stick toward centre before each subsequent increment. Horizontal rotation and
forward/backward locomotion are independent: use both axes simultaneously. If both
vertical stick axes are active, the stronger magnitude is used rather than
doubling the walking speed.

With two-hand grabbing, Zelda scales from **0.25× to 3.5×** the source size.
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

## Publishing and implementation

The version is shown **in the main page heading, below it, and in the footer**.
The main page is `index.html`; for Quest browsers still displaying an older
cached home page, open the explicit [Version 8 page](v8.html) at
`https://kuke2013-hub.github.io/vrzzz/v8.html`. Both URLs load the same current
`app.js?v=8` and `physics-grab.js?v=8` code after GitHub Pages publishes.
The query string `?v=8` is not by itself proof that the published code updated.

The site is a static GitHub Pages app (branch `main`, directory `/(root)`).
It requires HTTPS, WebXR `immersive-ar` and the `local-floor` reference
space in Quest Browser.

* `index.html`: controls and WebXR launch.
* `app.js`: GLB loading, headset-relative locomotion, stick input routing.
* `physics-grab.js`: Rapier-backed grab, dual-hand scale, 30° held-object yaw,
  kinematic hand following and fixed-pose release; zero gravity, no floor collider.
* `assets/zelda.glb`: optimised character mesh and embedded textures.

The left thumbstick remains the normal movement controller when neither hand is
gripping. The right thumbstick's vertical axis is enabled for walking when the
right grip is holding Zelda. If the right grip is not holding, its horizontal axis
still snap-turns the viewpoint.

Hardware limitation: actual controller tracking, squeeze events, passthrough
compositing and simultaneous diagonals must be checked in a physical Meta Quest 3.
A source-code check cannot prove headset behaviour.
