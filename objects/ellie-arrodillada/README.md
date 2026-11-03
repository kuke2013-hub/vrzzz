# Ellie Arrodillada — Quest 3 mixed reality

- Permanent URL: https://kuke2013-hub.github.io/vrzzz/objects/ellie-arrodillada/
- Model: `assets/ellie-arrodillada.glb` (source GLB 2.0)
- Original GLB bytes: **57,204,376**
- Original model SHA-256: `5dcec8338835b6135eace89359bacd3c9d68c225ef838afccf340ffd2cf917fa`
- Original geometry: 1,058,527 vertices / 1,867,898 triangles
- Original embedded PBR material, JPEG texture maps, UV coordinates and mesh topology preserved
- Controller engine: unchanged `../shared/app.js` and `../../VR_OBJECTS_TEMPLATE/physics-grab.js`
- Manifest: `objects/manifest.json`, status ready

## Geometry-seam repair (2026-11-03)
The previous 18,269,332-byte GLB used spatial/UV voxel-clustering simplification. Measured topology: the simplified asset had **22,815 non-manifold edges**, versus zero in the supplied original. Averaging mesh vertices across different UV atlas islands also moved previously coincident seam vertices apart and exposed dark, broken seam lines.

**Repair:** restore the exact original GLB with original geometry, vertex positions, normals, UVs, and embedded texture images, without destructive simplification. The model download is larger and GPU load may be higher. Chunked GitHub Actions transfer reconstructs and verifies its SHA-256 before publication. The page uses a new model URL query to prevent stale-cache loading.

**Testing:** structural/asset integrity verification and GitHub Pages deployment checks are separate from a physical Quest 3 test. Real headset performance has not been verified.
