# Zelda · Quest 3 passthrough

A browser-based, room-scale WebXR mixed-reality viewer for the **uploaded Zelda GLB**. Uses the same Meta Quest locomotion implementation as the [`london-flat-vr`](https://github.com/kuke2013-hub/london-flat-vr) project: left stick moves in the direction of the tracked headset (up/down/sideways), and the right stick performs **30° snap turns** about the physical head position.

## Model installed

The repository contains a **standalone, ready-to-render `assets/zelda.glb`** (11,668,312 bytes) and eight optional binary backup parts (`assets/zelda.part01`–`assets/zelda.part08`). The [reassembly workflow](.github/workflows/assemble-model.yml) has run successfully and reconstructed the standalone file, verifying SHA-256 `6da87f491b37c80eab5cebef794476468ea1af08bc253b949a9c33646aef4739`. The web app loads the standalone GLB, falling back to the segments if needed.

The character mesh is unchanged from the original. The embedded colour/normal/PBR textures are reduced for Meta Quest: colour and normal 2048 px, ORM 1024 px. The original, full-resolution GLB is preserved in the downloadable source bundle. The app also supports loading a local GLB from the file picker.

The source model is **crouched**, approximately **1.67m long, 0.80m high and 1.23m across**. It is already floor-up in the source coordinate system. Do **not** rotate it upright or stretch its height to 1.7m; the 0.8m height is correct for this pose. The scene automatically centers its bounds and places its lowest point on the reference-space floor. The character is located approximately 2m in front of the initial headset heading.

## Publish

GitHub → repository **Settings → Pages → Build and deployment → Deploy from a branch** → choose `main` and `/(root)` → Save. The expected site address is `https://kuke2013-hub.github.io/vrzzz/` *after Pages is successfully enabled and deployed*.

In Meta Quest Browser, open that HTTPS page and tap **ENTER PASSTHROUGH**. The browser must support WebXR `immersive-ar` with `local-floor`; the app does not silently fall back to opaque VR because that would hide the real environment. Grant permission when asked.

## Controls

| Device | Action |
|---|---|
| Quest left thumbstick up/down | Walk forwards / backwards, relative to real headset orientation |
| Quest left thumbstick left/right | Strafe left/right |
| Quest right thumbstick left/right | Snap-turn world heading 30° per deflection (release to re-arm) |
| Desktop mouse drag / scroll | Orbit and zoom |
| Desktop W/A/S/D | Move relative to desktop camera |
| Reset view button | Return locomotion offset and turn heading to original state |
| Floor button | Show/hide subtle 6m stage, grid and contact shadow |

## Technical notes

Three.js r186, glTF/GLB PBR loader, HTML/CSS/JS hosted as static files. Rendering uses a transparent WebGL canvas and `immersive-ar` mode for passthrough. `local-floor` makes `y=0` equal to the detected physical floor; no room mesh, wall occlusion or physics collision is implied. Accurate passthrough/joystick support depends on browser/headset firmware and must be tested on a physical Quest 3.