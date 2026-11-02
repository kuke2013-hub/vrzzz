# Zelda VR — Version history

The **current running version** is shown directly under the Zelda title on the
GitHub Pages site. Refresh after a deployment to see the new number. Each version
is backed by immutable GitHub commits, so earlier code can always be inspected
or restored even though Pages serves only the latest version.

| Version | Release | Changes | Source |
| --- | --- | --- | --- |
| **6.0** | 2 Nov 2026 | **Fix wrist-axis mismatch after repeated 30° model turns.** Joystick yaw is converted into the active controller's *grab-relative* orientation. Both one-hand grabbing and two-hand scaling retain wrist/hand alignment. No gravity or visible floor. | [Rotation fix commit](https://github.com/kuke2013-hub/vrzzz/commit/f7e7e23b8cfe3d26fb8cea4387621067076349de) |
| **5.0** | 2 Nov 2026 | Forward/back walking preserved on **either** thumbstick while its grip is holding Zelda; release freezes Zelda in mid-air; no floor collider. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/f72ec911814adb42617127404df583be77a31094) |
| **4.0** | 2 Nov 2026 | Holding Zelda redirects the held controller's horizontal thumbstick to 30° model yaw rather than locomotion/view turning. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/4596c17769876a42a6d2c2aaf76044d3e9391b86) |
| **3.0** | 2 Nov 2026 | Pure passthrough, grip pickup, two-hand resizing and the original physics experiment. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/f71ca02048d36d3990d5c10fcf42c65f79e81ce3) |

## Version 6.0 — wrist-aligned rotation

Previously, Zelda's held orientation used a world-yaw rotation applied *after*
the controller pose: `Y * (H * O)`. After a 30° snap, subsequent wrist motion was
also rotated by that extra world transform, so the rotation axis no longer
coincided with your physical wrist.

Now the 30° yaw is applied **at the instant of the snap** and then re-expressed
inside the controller's local grab offset:

- Single-hand: `O_new = inverse(H) * Y * H * O_old`.
- Dual-hand: `B_new = inverse(R) * Y * R * B_old`, where `R` is the current
  rotation inferred from the line between the two controllers.

During subsequent frames, the pose remains simply `H * O_new` (single hand) or
`R * B_new` (two hands). This makes physical wrist movement follow the actual
controller axes while preserving the prior 30° increments. The free-hand
locomotion, forward/backward movement while gripping, fixed release pose and
two-hand scale range remain unchanged.

### Testing

The quaternion correction was tested with a synthetic 25° wrist movement
following a 30° yaw. The old formula produced a **12.85°** axis mismatch for
that example; the corrected formula produced **0°** mismatch numerically.
Real Quest 3 controller and passthrough behaviour still requires a headset test.

## Previous snapshots

The [GitHub commit history](https://github.com/kuke2013-hub/vrzzz/commits/main/)
provides the complete timeline. The version numbers above are project-level
checkpoints; they do not imply separate published Pages URLs.
