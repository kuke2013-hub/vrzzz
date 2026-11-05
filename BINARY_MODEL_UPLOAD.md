# Reliable binary GLB publishing for VR Objects

**Use this working procedure in every new 3D model chat. Never stop after creating only a page or manifest entry.** The approved GitHub connector can commit text but cannot directly read local `/mnt/data` binary files; publishing through the existing model-assembly GitHub Actions pattern solves this without asking the user to upload manually.

## Tested on 5 November 2026

`objects/colour-female-06-p04/assets/colour-female-06-p04.glb` was uploaded successfully via 21 base64 chunks and GitHub Actions (commit `ed70b2157523c65b79642b10050d84916c2dc89b`). This followed earlier successful Evil Angel, Daphne, Ellie and anatomical woman assembly workflows.

## Workflow

1. Fetch the latest `main` tree and inspect `objects/manifest.json`, existing object pages, shared app and template. Never overwrite an existing object's files or controller engine.
2. Inspect the uploaded 3D asset and textures, and convert to a self-contained, Quest-compatible GLB. Locally validate GLB structure and compute its exact byte size and SHA-256.
3. Compress the GLB with xz and base64-encode the compressed stream. Split base64 on boundaries divisible by four (tested: 256 KiB characters/chunk). Keep original GLB SHA-256 and xz SHA-256.
4. Bridge files to the GitHub connector using **temporary personal Library files**: upload each locally generated text chunk with `files__manage_library` `container_path`; use `files__read` to obtain the chunk text inside the same `functions.exec` call that invokes `mcp__GitHub__create_blob`. This avoids manually copying huge blobs into chat. Ensure the read length matches the expected chunk length.
5. Create a GitHub tree based on the latest `main` tree, containing the new object page/config, `.transfer/partNNN.b64` blob references, the per-object assembly workflow and catalogue entry (initial `pending-model-upload` only). Create a commit, re-check `main` for concurrent changes and update the ref by fast-forward lease.
6. GitHub Actions concatenates all chunks, base64-decodes, xz-decompresses, verifies both SHA-256 values, tests GLB header, indices, texture and UVs, then commits the GLB to `objects/<id>/assets/<id>.glb`, updates the manifest to `ready` and removes temporary transfer chunks. The workflow must have `contents: write` and should `git pull --rebase origin main` before pushing.
7. **Verify** the GitHub Actions assembly run succeeded; the raw binary exists at the exact URL and matches the expected size; the manifest status is `ready`; original objects still exist; and GitHub Pages deployment for the model commit succeeded. If live HTTP or headset rendering cannot be tested, explicitly distinguish those checks.
8. Delete the temporary personal Library staging files and folder after successful transfer to avoid leaving user data behind.

**Never claim a binary upload or functioning Quest hardware test just because an HTML page was committed.** Do not change the Zelda v13 shared controller engine just to publish a model.
