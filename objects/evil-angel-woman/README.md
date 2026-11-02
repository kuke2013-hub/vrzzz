# Evil Angel Woman — Quest 3 VR Object

Permanent page: https://kuke2013-hub.github.io/vrzzz/objects/evil-angel-woman/

This page uses the existing shared app in `objects/shared/app.js` and the unchanged Zelda VR v13 controller in `VR_OBJECTS_TEMPLATE/physics-grab.js`. The original Zelda application and other objects have not been changed.

## Model

Source archive supplied on 2026-11-02: `source/desi2.fbx`, `textures/Mesh_6719_TXTR.png`, `textures/internal_ground_ao_texture.jpeg`.

- FBX format: binary v7500, one static triangulated mesh.
- Source geometry: 302,000 positions, 583,956 triangles; UV seams produce 494,773 glTF render vertices.
- Original dimensions: approximately 1.135 m × 1.898 m × 0.985 m; FBX units converted from centimetres to metres.
- Diffuse colour texture embedded into GLB as high-quality 4096×4096 JPEG. The small AO image was not bound by the source FBX material and was not applied.
- Self-contained GLB successfully parsed by trimesh; appearance in browser/Quest 3 not yet verified.

## Missing binary asset

The GLB was generated locally but could not be transferred through the available GitHub text-write connection. The GitHub-hosted model is **not published yet**. Upload the generated `evil-angel-woman.glb` into `objects/evil-angel-woman/assets/` without changing its name, then set status in `objects/manifest.json` from `pending-model-upload` to `ready`, and verify the GitHub Pages URL on desktop and Quest 3. Until then the page offers a local GLB picker, but its passthrough button remains disabled until a model loads.
