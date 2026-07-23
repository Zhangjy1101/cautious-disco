# Farm Feud Playable Ad MVP

This is a browser-runnable vertical slice based on `Farm_Feud_试玩广告_MVP策划案_v1.0`.

For the latest saved project status, decisions, verification results, and next-session checklist, read [HANDOFF.md](./HANDOFF.md).

## Scope

- Part 1: a dice-roll scene rebuilt against the supplied sketch direction.
- Part 2: the action scene based on the second sketch, reached by an automatic upward slide after each completed roll.
- Three deterministic review rounds: `FIRE! + x20`, `Small + x1`, and `Dynamax + x99`.
- Round 2 action copy is `Hurry up!`; Round 3 action copy is `Total wipe!`. Their dice prompts are `Push on! Better boosts!` and `Keep going! Max power!`.
- The third round multiplier is `x99` in the top banner, value callout, board result, and retained round configuration.
- Each round changes the banner, result callouts, accent theme, dice landing pose, and roll animation.
- Before each roll, outcome text and multiplier values are blank/hidden; they are revealed only after the dice land.
- After the result reveal, the dice screen shows a round weapon placeholder at bottom right: flame hammer, tiny wooden hammer, or golden mega hammer.
- Round 1 now runs the first real mole QTE: 3-second countdown, 10-second timer, nine holes, one-to-two random moles, one-hit knockouts, a 3-second flame hammer hit overlay, coin bursts at 3/6/9 seconds, and a 25% paw-meter settle.
- Round 2 now runs the negative mole QTE: 3-second countdown, 5-second timer, one-to-two random moles, two hit stages per mole with placeholder expressions, a rough tiny wooden hammer, two retained coin bursts, and a 25% -> 30% paw-meter settle.
- Round 3 now runs the jackpot mole QTE: 3-second countdown, 10-second timer, three-to-four simultaneous moles, a golden mega hammer that clears the active hole group with one field tap, increasing coin bursts per smash, light screen shake, a 30% -> 100% meter surge, and a center coin-firework finish.
- All three round hammers now follow the touch lifecycle: they appear on pointer down and disappear on pointer up or pointer cancel, then reappear on the next hit.
- The first dice screen now uses a bright comic reference treatment: blue ribbon banner, hidden opening result, `FIRE! / x20` reveal after the roll, green/orange hex board, red roll button, English instruction frame, pointing hand placeholder, and white button ornament.
- The confirmed dice result remains on screen for 2 seconds before the action screen transition begins.
- The action screens now hide the result panel, manual completion button, and round label; after a mole round completes, the next dice screen begins automatically after a 3-second hold.
- The house placeholder area is larger, a CSS reward chest placeholder sits at lower right, and the paw meter is lowered near the bear line.
- Coins are removed from the DOM after they collect into the paw meter; Round 3 fireworks are also removed after the burst.
- The dice animation is intentionally asset-free and can be replaced by a Cocos 3D dice prefab later.

## Run

From this directory, serve the files over HTTP so ES modules work in a browser. For example, with Node:

```powershell
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url==='/'?'/index.html':req.url));fs.readFile(p,(e,d)=>{if(e){res.statusCode=404;return res.end('Not found')}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(d)})}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'))"
```

Open `http://127.0.0.1:4173` and click the circular `ROLL` button. After each result, the page slides up to the matching Part 2 round. Complete the timed mole round to return to the next dice round. Expand `DEV HARNESS` to inspect state transitions and duplicate-input guards.

## Cocos migration boundary

`src/dice-stage.js` owns the three-round dice state machine and `src/mole-round.js` owns the timed mole interactions. These modules map to the Cocos round-director and interaction boundaries. The current CSS shapes are placeholders for SpriteFrame and Prefab references; no gameplay values are hidden in the view layer.

## Mobile Installation (PWA)

The project is packaged as an installable Progressive Web App. Deploy this folder to any HTTPS static host, open the deployed URL on a phone, and install it from the browser menu:

- Android Chrome: choose **Install app** or **Add to Home screen**.
- iPhone Safari: choose **Share** -> **Add to Home Screen**.

The first launch downloads all gameplay assets for offline use. Once installed, the app opens in a standalone portrait window and can run without a network connection. For same-Wi-Fi preview only, run `node server.mjs` on this computer and open `http://<computer-lan-ip>:4173` from the phone; HTTPS is required for installation and offline caching on a physical device.