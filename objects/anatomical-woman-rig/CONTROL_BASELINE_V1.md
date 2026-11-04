# Anatomical Woman — WORKING CONTROL SYSTEM v1 (frozen baseline)

Date: 2026-11-04

## Verified recovery point

Entire working VR application and rigged GLB (including all other VR objects) are preserved at commit `5a48567d3fee770dd572753c10f37231238edbeb`.

Stable preservation branch: [`anatomical-woman-v1-working-controls`](https://github.com/kuke2013-hub/vrzzz/tree/anatomical-woman-v1-working-controls).

The baseline branch points at that pre-refinement snapshot; future weight-painting experiments must not modify it.

## Separate, unmodified source snapshots

The files in `baselines/controls-v1/` are **archival snapshots**, not runtime imports:

- `limb-grab.js`: close-range light-grey joint rings, Quest **index trigger** / WebXR `selectstart` and `selectend`, joint selection, IK and approximate angle limits, follow-through root motion, frozen release, and desktop ring posing.
- `app.js`: model loader, WebXR session setup, the original Zelda v13 joystick mapping and view snap rotation, reset and frame update ordering. The live app imports `./limb-grab.js?v=1`.
- `physics-grab.js`: byte-for-byte original shared `VR_OBJECTS_TEMPLATE/physics-grab.js`, including side-squeeze whole-body movement, zero gravity and release freeze, two-handed linear resizing 0.10–3.50x, remote grip manipulation, and right-stick 30-degree rotation.
- `index.html`: user interface and WebXR import map as published in v1.

The archive copies preserve the original source verbatim, including **original relative imports**; do not load archived `app.js` directly from its archive location. To restore an operational application, check out the stable branch or the exact recovery commit above.

## Approved controller behavior — DO NOT REGRESS

1. Index-finger **trigger** near the light-grey circle poses the corresponding body part; closing the hand side **grip** does not accidentally become a limb pose action.
2. Side-squeeze grips continue to grab/move/rotate the entire figure nearby or at a distance, individually or two-handed.
3. Both side grips scale the **whole body linearly from 10% to 350%**.
4. Both controller wrist positions, wrist orientation and ray direction retain their v13 effects. Left-stick X moves the figure laterally; either stick Y adjusts figure distance; right-stick X snap-turns the view unless holding the object, when it snaps the figure 30 degrees.
5. Close-range grey handles cover head, neck, chest/pelvis, shoulders, elbows, hands, thighs, knees and feet. Drag a joint to use the approximate constraints and body follow-through.
6. Released body and articulated joints remain at their final pose. Passthrough contains no virtual floor or gravity.
7. Do not alter existing objects, the template's canonical engine, or the original Zelda demo while improving weights.

## Scope of future improvements

The user has confirmed that controls work well. **Only skin weights, skin deformation, corrective shapes or mesh-bound rig fitting are in scope for the next revision.** Before shipping any replacement GLB, check preservation of UVs/materials/texture, bone names and hierarchy, rest pose and dimensions, normalized weights, joints at full range, and compatibility with the v1 handle definitions. Benchmark elbows, shoulders, knees, hips, neck and torso on the headset. Maintain an independent candidate version until tested.

**Limitations:** this is an empirical known-good interaction baseline based on user feedback. The joint ranges and generated skin weights are not clinically validated; hardware regression tests remain necessary for subsequent revisions.
