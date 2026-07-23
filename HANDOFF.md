# Farm Feud Playable Prototype - Work Handoff

Last updated: 2026-07-22

Saved checkpoint: Browser dice-art replacement in progress. This checkpoint includes the complete three-round gameplay flow plus the supplied dice-screen background, radial-rays, and board image layers.

## Source material

- Product plan: `C:\Users\TU\.ad\Farm_Feud_试玩广告_MVP策划案_v1.0.docx`
- Current browser prototype: `C:\Users\TU\.ad\playable-prototype`
- Dice art source: `C:\Users\TU\Desktop\TUYOO\Week2-3_ad\掷骰界面icon`
- Visual references: the dice screen and action screen sketches supplied in the Codex conversation.

The reference images were supplied inside the conversation and are not currently stored as separate image files in the workspace. Their requirements are recorded here.

## Current milestone

The browser entry now has two vertically stacked gameplay sections:

1. Part 1: dice roll screen.
2. Part 2: action screen, with Rounds 1 and 2 implemented as whack-a-mole prototypes.

The previous farm/mole/reward/rebuild controller remains in the repository for later reuse but is not connected to the current entry.

## Latest flow

```text
READY R1
  -> click circular ROLL
  -> positive dice animation
  -> BUFF x20 result
  -> automatic upward screen slide
  -> Round 1 mole QTE
  -> COMPLETE ROUND 1
  -> slide back to dice
READY R2
  -> Small x1
  -> Round 2 two-hit mole QTE
  -> COMPLETE ROUND 2
READY R3
  -> Dynamax x99
  -> Round 3 group-smash mole QTE
  -> RESTART THREE ROLLS
  -> READY R1
```

The Part 2 button is still temporary completion plumbing shown after each round settles. All three QTEs are now wired; the remaining placeholders are art, audio, and platform integration.

All three rounds now use the mole controller. Round 1 has one-hit moles, a 10-second timer, flame hammer, staged coin bursts, and a 25% paw-meter settlement. Round 2 has two-hit moles with two placeholder expression stages, a 5-second timer, tiny wooden hammer, smaller staged coin bursts, and a 25% -> 30% paw-meter settlement. Round 3 has three-to-four simultaneous moles, a 10-second timer, a golden mega hammer that clears the current group with a field tap, increasing smash coin bursts, light screen shake, and a 30% -> 100% fireworks settlement.

## Latest visual requirements

- The full playable ad is divided into two parts.
- The dice screen is the first part and uses a sketch-inspired ribbon banner, hexagonal board, two 3D-looking dice, and a bottom circular button.
- The first dice screen visual pass uses a bright yellow comic field, blue ribbon, green/orange hexagonal board, red roll button, yellow English instruction frame, pointing hand placeholder, and white decorative frame around the button.
- On the first opening state, `FIRE!` and `x20` are hidden. They appear only after the dice land.
- The first instruction frame reads `Tap to decide the farm's fate!`, sits above the roll button layer, and is moved upward to avoid button overlap.
- A confirmed dice result remains visible for 2 seconds before the automatic upward transition begins.
- On all three action screens, the result panel, manual completion button, and round label are hidden to match the supplied artwork structure.
- After each mole round completion, the controller waits 3 seconds and automatically returns to the next dice screen; there is no manual completion step in the visible UI.
- The house placeholder is intentionally larger for future art replacement, the lower-right reward chest is a CSS placeholder, and the paw meter is lowered to the bear's horizontal area.
- Coins are cleared after normal collection; Round 3 fireworks are cleared after the final burst.
- After a completed roll, the page slides upward to the second screen.
- The first roll is positive: `BUFF` and `x20`.
- The second roll uses `Small` and `x1`.
- The third roll uses `Dynamax` and `x99`.
- Round 2 action callout reads `Hurry up!`; Round 3 reads `Total wipe!`.
- Round 2 dice prompt reads `Push on! Better boosts!`; Round 3 reads `Keep going! Max power!`. Both prompt boxes use the raised, button-safe position.
- Each round changes the banner, result bubbles, accent colors, board copy, dice landing pose, and roll animation style.
- Before every roll, outcome text and multiplier values are blank/hidden. They are revealed only after the dice land, including rounds 2 and 3.
- After each result reveal, a bottom-right weapon placeholder appears: flame hammer for round 1, tiny wooden hammer for round 2, and golden mega hammer for round 3.
- Round 1 action screen starts with a full-screen `3 / 2 / 1` countdown after the slide settles.
- Round 1 has a 10-second horizontal timer under the BUFF banner.
- Nine holes can show one or two simple placeholder moles at a time; clicking an active mole applies a stunned reaction.
- Each hit shows the flame hammer overlay for up to 3 seconds.
- Coins burst at 3, 6, and 9 seconds with increasing counts and remain visible until the 10-second collection.
- At timeout, coins collect into the paw meter and the Round 1 fill is set to 25%.
- Round 2 starts with the same countdown and nine-hole field, but uses a 5-second timer, two-hit moles, first-hit damage and second-hit knockout placeholder expressions, a tiny wooden hammer overlay, coin bursts at 2 and 4 seconds, and a final paw-meter fill of 30%.
- Round 3 starts with the same countdown and nine-hole field, but shows three or four moles at once. Tapping the field positions the golden mega hammer at the center, knocks out every active mole, emits a larger coin burst than the previous smash, and lightly shakes the screen. The 10-second timeout surges the paw meter to 100% and launches a center coin-firework effect before enabling restart.
- Hammer input lifecycle is shared by all three rounds: `pointerdown` shows the round-specific hammer, `pointerup` or `pointercancel` hides it immediately, and the next valid hit shows it again. Keyboard/programmatic clicks use a short fallback hide timer.
- The small yellow decorative marker lines beside the roll button were removed from the dice screen.
- A manual upward swipe is accepted after the dice land; automatic slide remains the default.
- Roll input and page switching are locked during animation and transitions.

## Implemented files

- `index.html`: two-screen markup, dice screen, action screen, and test controls.
- `styles.css`: two-screen slide layout, three themes, CSS 3D dice, different roll animations, mole/hammer/coin effects, and responsive rules.
- `src/main.js`: DOM bindings, roll button, round-complete button, weapon placeholder, reset, and pointer swipe wiring.
- `src/dice-stage.js`: `DICE_ROUNDS`, round state machine, timers/tokens, automatic/manual screen switching, round progression, result reveal, weapon selection, reset, and logs.
- `src/mole-round.js`: Three configurable countdowns, mole spawns/hits, two-stage damage, pointer-lifecycle single-target and area hammer overlays, timers, staged/smash coin bursts, collection, fireworks, and completion callbacks.
- `assets/dice/background.png`: user-provided blue vertical dice-screen background, rendered at the bottom of the dice screen.
- `assets/dice/base-ui.png`: user-provided base UI, rendered above the background and below the radial rays.
- `assets/dice/rays-effect.png`: user-provided radial rays effect, rendered above the base UI and below the gameplay UI.
- `assets/dice/board.png`: user-provided gold-framed green board, rendered inside the dice UI below the dice, labels, and result text.
- `assets/dice/button.png`: user-provided red dice roll button, preserving the existing button position and DOM interaction binding.
- `server.mjs`: local static development server.
- `README.md`: run instructions and current scope.

## Current behavior

1. The page opens on dice screen round 1.
2. The supplied red dice button starts a locked roll.
3. Round 1 lands as `BUFF x20`, then slides to the playable mole round.
4. Completing the placeholder returns to dice screen round 2.
5. Round 2 lands as `Small x1` with a slower/weak roll motion, then starts the 5-second two-hit mole round.
6. Round 3 lands as `Dynamax x99` with a stronger roll motion, then starts the 3-to-4 mole group-smash round.
7. Completing round 3 resets to round 1 for repeat testing.
8. Expanding `DEV HARNESS` exposes state and event logs.

Round 1 action details:

1. Each playable action page settles, then shows `3`, `2`, `1` over the full screen.
2. Round 1 starts a 10-second timer; Round 2 starts a 5-second timer.
3. One or two moles rise from the nine holes at random intervals.
4. Round 1 moles fall after one hit. Round 2 moles show a damaged expression after the first hit and fall after the second hit.
5. Round 1 uses the flame hammer and 3s/6s/9s coin bursts. Round 2 uses the tiny wooden hammer and 2s/4s coin bursts.
6. At timeout, coins collect and the paw meter settles at 25% for Round 1 or 30% for Round 2; Round 3 surges to 100% and launches center fireworks. Only after each settlement is its round completion button enabled.

At every `READY` state the dice screen hides the banner result, multiplier burst, function/value callouts, board result, and result labels. The roll button and neutral tap instruction remain visible so the player still knows where to interact.

## Run next session

```powershell
cd C:\Users\TU\.ad\playable-prototype
node server.mjs
```

Open `http://127.0.0.1:4173`.

## Verification completed

- `node --check src/main.js`: passed.
- `node --check src/dice-stage.js`: passed.
- Required DOM ID audit: passed.
- HTTP load checks for HTML, CSS, `main.js`, and `dice-stage.js`: all returned 200.
- Full controller test passed for three rounds, automatic slide, manual upward swipe, repeat-click lock, third-round restart, and reset.
- Hidden-before-roll/reveal-after-roll test passed for all three rounds.
- Weapon hidden/reveal test passed: `flame -> tiny -> mega`, then reset to hidden flame state.
- Round 1 mole controller test passed: countdown path, one-hit hammer, three coin bursts totaling 25 placeholder coins, 10-second settle, and 25% paw meter.
- Round 2 mole controller test passed: countdown path, two hit stages, tiny hammer, two coin bursts totaling 5 placeholder coins, 5-second settle, and 30% paw meter.
- Round 3 mole controller test passed: 3-4 simultaneous moles, area smash clearing, increasing smash coin bursts, shake/hammer states, 100% meter surge, fireworks nodes, and final completion callback.
- Hammer lifecycle test passed for all three rounds: visible on pointer down and hidden on pointer up for flame, tiny, and mega hammer variants.
- First dice screen state/timing test passed: opening result is hidden, instruction copy is `Tap to decide the farm's fate!`, landed result is `FIRE! / x20`, the page remains in `RESULT` during the delay, and only then enters `ACTION`.
- Action flow test passed: all visible completion controls are hidden, the next dice screen starts automatically after 3 seconds, Round 1 and Round 3 coin layers are empty after settlement, and Round 3 paw meter reaches 100%.
- Copy/multiplier state test passed: Round 2 uses `Hurry up!` and `Push on! Better boosts!`; Round 3 uses `Total wipe!`, `Keep going! Max power!`, and `x99` across the result surfaces.
- Round naming state test passed: Round 2 displays `Small`; Round 3 displays `Dynamax` across the banner, skill label, action result type, and board configuration.
- Prior browser screenshot QA passed on `http://127.0.0.1:4173/`: the original background and rays layers loaded, and a Roll click reached `RESULT` with `FIRE! / x20`.
- Board replacement static QA passed: source, project copy, and HTTP response share SHA-256 `8480FA822D2C8695EF1AF7190F8B86E3624DBFA411406B38A3C8C7A919380AE9`; the page and all three dice image requests return HTTP 200. Browser screenshot QA was not rerun because the local browser-control runtime was blocked by the Windows sandbox ACL.
- Base UI and button replacement static QA passed: source and project hashes match for both files; the current layer order is background `z-index: 0`, base UI `z-index: 1`, rays `z-index: 2`; the page, CSS, `main.js`, and all four dice image requests return HTTP 200. The original `rollButton` and `rollButtonLabel` bindings remain intact.

## Known limitations

- Dice are CSS 3D cubes, not imported 3D model assets.
- The three hammers are CSS shape placeholders, not final image textures.
- Mole art and coins are CSS/DOM placeholders; no final sprite or audio assets are included.
- Results are deterministic for creative review.
- Final art, audio, and platform integration are still placeholders; all three round interaction loops now have browser prototype logic.
- The current page is a browser prototype, not a Cocos Creator project.
- No Cocos Scene, Prefab, Inspector bindings, Web Mobile build, or platform SDK integration exists yet.
- The reference images are not stored locally as files.

## Recommended next starting point

Continue replacing one dice-screen asset group at a time:

1. Replace `气泡框.png`.
2. Replace `手1.PNG`.
3. Replace the blue banner and multiplier layers.
4. After each group, verify the opening screen, Roll click, result reveal, and automatic page transition.

Keep this checkpoint browser-only. Do not start the Cocos Creator migration from this handoff.
