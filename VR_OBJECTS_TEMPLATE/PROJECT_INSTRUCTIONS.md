# VR Objects — ChatGPT Project instructions

This project uses an existing, reusable Quest 3 mixed-reality environment,
not a new VR app written from scratch.

**Canonical GitHub template:**
https://github.com/kuke2013-hub/vrzzz/tree/main/VR_OBJECTS_TEMPLATE

**Model-free test page:**
https://kuke2013-hub.github.io/vrzzz/VR_OBJECTS_TEMPLATE/

**Known-good controls baseline:** Zelda VR v13.0, commit
https://github.com/kuke2013-hub/vrzzz/commit/362e97ff29d42641981c0cb0f8672b3a89db3fc0

When asked to work with a new 3D object (OBJ, FBX, BLEND, GLTF/GLB, STL, DAE
or other format), inspect its geometry/materials/unit scale, convert it to a
self-contained GLB when practical, and mount it into a **COPY** of the
`VR_OBJECTS_TEMPLATE` app. Do not add Zelda or any other default object.

**Preserve these controls exactly** unless I explicitly ask to change them:

1. Quest 3 pure passthrough, no simulated floor, grid, gravity or visible stage.
2. Side squeeze grip on either controller grabs near or far using Quest
   target-ray selection; remote aim assist, no artificial pick distance cap.
3. Once grabbed, either/both controllers reposition model up/down/left/right,
   even at remote distances, through tracked hand + pointing-ray motion.
4. One-hand wrist movement rotates model. Two-hand right wrist pitch/roll
   works simultaneously with movement and size adjustment.
5. Both grip buttons together: **linear 10%–350% resizing**. No huge/infinite
   model-scaling experiments.
6. Left stick X moves the MODEL left/right, held or unheld; no viewer strafe.
7. Left or right stick Y: BACK pulls model closer, FORWARD pushes it away,
   regardless of grip; no player forward/backward movement.
8. Right stick X rotates held object in 30° increments; when not holding
   with the right grip it snap-turns the view 30°. Recenter between snaps.
9. Release last grip freezes exact model world position/orientation/scale.
10. Preserve arm-scale fidelity, original object proportions/materials,
    transparencies and textures. Avoid hardcoded Zelda dimensions or pose.

Do not overwrite the working `vrzzz` Zelda app. Work in a separate copy,
folder or repository. Reuse `physics-grab.js` as the known-good controller
engine. Update visible version labels and cache-busting URLs on changes,
maintain a version history, and report actual GitHub commits. Confirm source
checks separately from real Quest 3 hardware testing; never claim a live
deployment or headset test without checking it.

For models from OBJ/FBX/other formats, prefer converting to embedded-texture
GLB to avoid broken external texture or MTL paths. A standalone FBX/OBJ may
work for geometry but is not guaranteed to preserve materials automatically.

## Mandatory publishing and verification contract

**Full self-service upload is required.** When a model is uploaded in this ChatGPT Project, the assistant is responsible for producing, uploading, committing, deploying, and verifying the real model asset and its page without making the user upload, rename, or copy files or run Git commands. Do not send the user an asset-folder link as a manual workaround. Do not announce a finished object if the GLB is absent or HTTP returns 404. If current tools cannot transfer binary data, be explicit that publication is blocked; use a genuinely binary-capable execution environment rather than invent success. Never claim that a text-only GitHub commit uploaded the GLB.

Before announcing success, check the exact case-sensitive \`modelUrl\` in each object's \`config.js\`, the asset path in \`objects/manifest.json\`, the GitHub repository binary blob, the HTTPS Pages response (HTTP 200 and valid GLB header), and actual browser loading. Compare filenames literally. Confirm deployment success but understand that deployment success alone does not prove an asset was included. Retain prior objects and the original Zelda app.

**Required brightness control for all new objects:** Every independently published object page must use the shared \`objects/shared/app.js\` brightness control in its pre-passthrough menu. Default is 100% = the original lit appearance; 0% = black rendering of the model, with all intermediate brightness levels. The control must act on model pixels only, not on the physical passthrough environment, other pages or controller behaviour. Preserve model textures, materials and their alpha; adjust rendered output without destructive edits to GLB or rewriting \`physics-grab.js\`. Keep the slider available before the "Enter Passthrough" button and make its chosen value apply inside XR. Test both endpoints and an intermediate value where browser testing is available.
