# Anatomical Woman · Articulated Rig v1

This is an independent Meta Quest 3/WebXR puppet experience. The GLB is the original uploaded adult female model with a procedural 22-bone skeleton, normalized four-bone skin weights, the original embedded JPEG texture, mesh topology, normals, and UVs. This project preserves the original Zelda v13 `VR_OBJECTS_TEMPLATE/physics-grab.js` controller engine and adds a separate `limb-grab.js` module for joint interaction.

**Controls:** side squeeze grip moves, rotates and linearly resizes the entire body (10–350%). Index-finger trigger while close to a light-grey circle poses a selected body part (head, neck, chest, pelvis, shoulder, elbow, wrist/hand, thigh, knee, foot). Left thumbstick X moves the body sideways, either thumbstick Y controls its distance, and right thumbstick X either snap-turns the view or rotates the held body in 30° steps. No virtual floor or gravity. Pose and position remain fixed on release.

**Rig/physics limitation:** the vertex weights and joint ranges are automated approximations. They are not biomechanically validated and do not simulate muscles, dynamic soft tissue, collisions or advanced corrective blendshapes. The controls were checked by static analysis, but real Quest 3 hardware behaviour requires headset testing.

The native `assets/character-rigged.glb` is reassembled by the model-specific GitHub Action from temporary transfer parts; its exact SHA-256 is verified before the central object manifest is changed. Do not manually modify the shared controller engine or any other object's files.
