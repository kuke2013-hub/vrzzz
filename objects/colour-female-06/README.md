# Colour Female 06 P01 · Quest 3 passthrough

Object page: https://kuke2013-hub.github.io/vrzzz/objects/colour-female-06/

**Status: ready.** The page automatically loads the byte-verified GLB from `objects/colour-female-06/assets/colour-female-06.glb`. A local file picker remains available as an optional override.

Source supplied by the user: `Colour Female 06 P01.OBJ` ZBrush mesh and `Colour Female 06 P01_Colour_16k.jpg` colour atlas. Original OBJ references a missing `.mtl` file; the supplied image was embedded directly into the exported GLB. Mesh: 374,998 source positions, 378,458 UV-split GLB vertices, 749,992 triangles; 2048×2048 supplied texture; GLB size 23,475,124 bytes. The mesh geometry, UVs, pose, proportions and material colour are preserved with no decimation. It contains no armature or skin weights. Source object height is ~1.752 units; the source has no declared physical unit scale, and the VR config does not normalize or rescale it.

App imports existing `objects/shared/app.js` which uses the Zelda v13 controls from `VR_OBJECTS_TEMPLATE/physics-grab.js`. Existing objects and controller engine remain unchanged. The no-floor, zero-gravity passthrough and whole-body grip/resize/translation/rotation rules are preserved.

GLB was validated by re-import and by the SHA-256 checksum during the GitHub Actions reconstruction. GitHub Pages deployment completed successfully. A physical Quest 3 headset test has not been performed.
