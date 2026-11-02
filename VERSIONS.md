# Zelda VR — Version history

The **current running version** is shown directly under the Zelda title on the
GitHub Pages site. Refresh after a deployment to see the new number. Each version
is backed by immutable GitHub commits, so earlier code can always be inspected
or restored even though Pages serves only the latest version.

| Version | Release | Changes | Source |
| --- | --- | --- | --- |
| **11.1** | 2 Nov 2026 | **Correct minimum resizing bound to 10% (maximum 350%)**, retaining linear two-hand scaling and all Version 10 joystick/wrist behaviour. Reconciles a conflicting Version 11 change that had restored 25%. | [GitHub revision history](https://github.com/kuke2013-hub/vrzzz/commits/main/) |
| **11.0** | 2 Nov 2026 | **Restore the original 25%–350% two-hand resize limits**, with linear hand-spacing response. Preserve all Version 10 controls and right-wrist pitch/roll. Corrects the intermediate v10.1 10% minimum. | [Source correction](https://github.com/kuke2013-hub/vrzzz/commit/4c400efed6f2264ffbd60cc152715bc7f29089f9) |
| **10.1** | 2 Nov 2026 | **Restore linear two-hand resizing within 10%–350%.** Remove Version 10 nonlinear, microscopic/giant size limits; preserve all other joystick, wrist, grab and no-gravity controls. | [Resizing fix](https://github.com/kuke2013-hub/vrzzz/commit/d2a6a9097eb61d50fb3cafda61adcf582b631657) |
| **10.0** | 2 Nov 2026 | **Extreme fourth-power two-hand scaling** from 0.00001× (dot) to 10,000× (landmark). Left-stick X translates Zelda sideways instead of moving the player or turning Zelda. Wider camera/depth ranges; no oversized Rapier collider. | [Scaling and joystick implementation](https://github.com/kuke2013-hub/vrzzz/commit/c10e6c1ee52b6e756ca4cf37447e03629a486103) |
| **9.0** | 2 Nov 2026 | **Pull or push Zelda with the vertical axis of EITHER thumbstick**, both when gripping and when not gripping. Back pulls Zelda toward you; forward sends her farther away. The headset stays still. Preserves two-hand scale, right wrist pitch/roll and horizontal stick turning. | [Model-depth implementation](https://github.com/kuke2013-hub/vrzzz/commit/c365346c1b3835d631fcc3b39068b751a9c019aa) |
| **8.0** | 2 Nov 2026 | **Right-hand wrist pitch UP/DOWN added** during two-hand resize, alongside existing left/right roll. Changes use controller-local two-axis rotation with hand-line swing and 30° joystick turns preserved. Version number is prominent in the main heading; includes a [version-specific entry page](https://kuke2013-hub.github.io/vrzzz/v8.html) for cached-home-page situations. | [Pitch + roll implementation](https://github.com/kuke2013-hub/vrzzz/commit/04a2e28bc02741fabd19375cc6f37416465fe14b) |
| **7.0** | 2 Nov 2026 | **Two-hand resize + right-wrist twist simultaneously.** Preserve the line-between-hands swing, track wrist roll from the *right* controller as the priority source, and compose both into the model transform. Right thumbstick 30° rotations remain in the combined frame. | [Two-hand twist implementation](https://github.com/kuke2013-hub/vrzzz/commit/7f7e01ab1423d2e4b118ab950ac9feb91cf0bbb4) |
| **6.0** | 2 Nov 2026 | **Fix wrist-axis mismatch after repeated 30° model turns.** Joystick yaw is converted into the active controller's *grab-relative* orientation. Both one-hand grabbing and two-hand scaling retain wrist/hand alignment. No gravity or visible floor. | [Rotation fix commit](https://github.com/kuke2013-hub/vrzzz/commit/f7e7e23b8cfe3d26fb8cea4387621067076349de) |
| **5.0** | 2 Nov 2026 | Forward/back walking preserved on **either** thumbstick while its grip is holding Zelda; release freezes Zelda in mid-air; no floor collider. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/f72ec911814adb42617127404df583be77a31094) |
| **4.0** | 2 Nov 2026 | Holding Zelda redirects the held controller's horizontal thumbstick to 30° model yaw rather than locomotion/view turning. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/4596c17769876a42a6d2c2aaf76044d3e9391b86) |
| **3.0** | 2 Nov 2026 | Pure passthrough, grip pickup, two-hand resizing and the original physics experiment. | [Checkpoint](https://github.com/kuke2013-hub/vrzzz/commit/f71ca02048d36d3990d5c10fcf42c65f79e81ce3) |

## Version 11.0 — original size restrictions restored

Two-hand scaling is once again linear, based on the ratio of current hand
separation to separation when the second grip engaged, with the original
range clamped to **0.25×–3.5×**. The Version 10 nonlinear/exponential resizing
and micro/giant range are retired. The intermediate 10.1 version used a 10%
minimum; Version 11 corrects the lower bound to 25%.

All other current controls remain: the left stick X translates Zelda, either
stick Y pulls/pushes Zelda, the right stick X rotates her 30° when gripped,
right-wrist pitch/roll works during two-hand resizing, passthrough remains
transparent, and release freezes the model without gravity.

[Open Version 11](https://kuke2013-hub.github.io/vrzzz/v11.html).

## Version 11.1 — user-selected 10%–350% resizing

Two-hand gripping scales Zelda linearly between **0.10× and 3.50×**
normal size. This corrects a conflicting Version 11 change that had set the
minimum to 0.25×. Both-stick pull/push, left-stick sideways model movement,
right-stick 30° model yaw, dual-hand wrist pitch/roll and zero gravity remain.
Current version-specific entry: https://kuke2013-hub.github.io/vrzzz/v11-1.html

## Version 10.1 — restore linear resizing

Following user testing, the extreme model-scaling experiment in Version 10
has been reverted **only for two-hand resizing**. Separating or closing
both grips now adjusts size **linearly** with hand spacing and clamps size
between **0.10× and 3.50×** normal. This replaces the fourth-power
0.00001×–10,000× scaling.

All other Version 10 changes remain: left-stick X moves Zelda sideways
rather than the player, either thumbstick Y pulls/pushes Zelda whether
gripped or not, right-stick X rotates Zelda 30° when right grip is active,
right wrist pitches and rolls during dual-hand grabbing, and release
remains zero-gravity/fixed in space. The separate Version 10.1 entry page
is [v10-1.html](https://kuke2013-hub.github.io/vrzzz/v10-1.html).

## Version 10.0 — extreme size and sideways model controls (historical)


The previous linear 0.25×–3.5× resizing limit has been replaced by
a fourth-power relationship between the distance of the two grips and their
distance when two-hand grabbing began. The model's effective size is clamped
to **0.00001× to 10,000×** (one billion-fold total range). It is not literal
infinity: renderers cannot represent zero, infinite or arbitrarily large
sizes reliably. Re-gripping allows successive scale adjustments.

The object is kept centred near its previous two-hand midpoint rather than
multiplying its offset by the new size; that avoids sending it off into the
distance while enlarging it. Fixed-body collision geometry has been removed
because the environment already has no gravity or collisions. View and model
depth ranges are extended to 50km, with faster push/pull for larger objects.

The **left thumbstick horizontal axis now moves Zelda sideways**, left or
right, relative to the user's gaze direction, regardless of which side-grip
buttons are pressed. This replaces the previous left-stick strafing and
left-grip 30° turning behaviours. Right-thumbstick horizontal turns remain
unchanged: right grip held rotates Zelda 30°; right grip released rotates the
viewpoint. Either vertical thumbstick still pulls/pushes Zelda.

A [version-specific Quest entry page](https://kuke2013-hub.github.io/vrzzz/v10.html)
helps avoid a stale cached home page. GitHub Pages publication and physical
Quest control behaviour still require separate verification.

## Version 9.0 — reverse thumbstick depth to pull Zelda

**Either stick back (Y positive) pulls Zelda toward the headset; either stick
forward (Y negative) moves Zelda away.** This works regardless of whether the
left, right, both or neither grip buttons are held.

The app obtains the current headset position in world coordinates, finds
the line from the headset toward Zelda, and updates Zelda's distance along
that line at up to 1.4m/s, clamped to 0.6–12m. The locomotion rig is never
translated by a vertical stick input.

While a grip is active, a world-space `depthOffset` is added *after* the
one-hand or two-hand controller transform on every frame. This ensures
pulling/pushing works simultaneously with hand-following, right-wrist
pitch/roll, two-hand scaling and 30° thumbstick yaw, without snapping back.
When switching from one grip to two or vice versa, the already-moved model
pose is made the new baseline and the offset resets to zero. With no grip
active, the fixed model body and rendered group are both translated directly.

When both sticks are used vertically at once, the larger deflection is
selected (right wins exact ties) instead of adding movements. Horizontal
controls remain as before: unheld left X strafes, unheld right X snap-turns
the viewpoint, and held-hand X rotates Zelda by 30° steps.

**Version-specific address:**
https://kuke2013-hub.github.io/vrzzz/v9.html

### Verification boundary

The updated JavaScript and input routing can be source-tested and the depth
math tested with synthetic headset/character positions. Actual controller
input, model tracking and the live Pages deployment still require verification
on Meta Quest 3.

## Version 8.0 — add wrist pitch while resizing

With both side-grip buttons held, hand separation controls size, the hand-to-hand
direction provides the main swing, and **right-wrist up/down pitch and left/right
roll are both tracked**. They can occur simultaneously. The right-hand input is
prioritized for these two wrist axes; the left hand controls size and the
hand-line direction along with the right hand.

The right controller's current orientation is compared to the orientation
expected from the hand-line swing alone. The residual is expressed in the
right controller's local coordinates. A quaternion swing–twist decomposition
removes only the local-Y yaw component, retaining both local-X pitch and
local-Z roll. This two-axis residual is transformed to world coordinates and
combined with the hand-line swing. The result drives Zelda's orientation and
her offset about the midpoint between the hands.

**Version visibility:** The GitHub source previously contained the Version 7
label, but the user's Quest browser did not display it. This is consistent
with either a cached page or an old GitHub Pages deployment, and the live
page could not be independently retrieved to distinguish the cause. Version 8
therefore displays its number in both the **large heading** and the **footer**,
and adds [v8.html](https://kuke2013-hub.github.io/vrzzz/v8.html) as a separate
entry point.

### Source tests

The updated transform passed mathematical cases for neutral grip, 35° isolated
wrist pitch, 40° isolated wrist roll, 50° hand-line swing, 40° isolated wrist
yaw (properly excluded), and pitch over a rotated grip. Both JavaScript
modules passed syntax checks. Physical Quest 3 tracking is unverified.

## Version 7.0 — simultaneous two-hand resize and right-wrist roll

When both Quest grip buttons are held, the distance between the controllers still
determines size (25–350%). The hand-to-hand direction sets the broad orientation
of Zelda in space. The **right-hand controller** additionally supplies wrist
twist (roll about its own forward/pointing axis), independent of changing the
hand spacing.

At the moment the second grip engages, the app records the right controller's
neutral orientation. Later it predicts the orientation that controller would
have if it only followed the hand-to-hand swing. It computes the residual right
wrist rotation, extracts the roll component around the controller's pointing
axis, and combines the two:

`twoHandFrame = rightWristTwist * handToHandSwing`

This combined frame drives Zelda's rotation **and** the offset of Zelda from the
midpoint of your hands, avoiding a floating or disconnected pivot when she is
held off-centre. When the thumbstick rotates Zelda 30°, the turn is baked into
this full combined frame. When you release one grip, the remaining hand takes
over with its current orientation and no deliberate snap-back.

### Transform tests

A synthetic quaternion test suite checked neutral second-grip engagement
(0° jump), 40° isolated right-wrist roll, 50° hand-line swing, combined 50°
swing plus 65° wrist twist, and preserving a 30° joystick turn after combined
motion. All tests passed to numerical precision. **Quest 3 headset behaviour
has not been tested from this chat**, so test the grip transition and twisting
with the controllers before treating the feature as hardware-verified.

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
