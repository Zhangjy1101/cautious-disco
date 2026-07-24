import { DiceStageController } from './dice-stage.js';
import { MoleRoundController } from './mole-round.js';

const $ = (id) => document.getElementById(id);

const elements = {
  gameRoot: $('gameRoot'),
  diceScreen: $('diceScreen'),
  actionScreen: $('actionScreen'),
  roundIndicator: $('roundIndicator'),
  bannerText: $('bannerText'),
  bannerResult: $('bannerResult'),
  rollButton: $('rollButton'),
  rollButtonLabel: $('rollButtonLabel'),
  skillDie: $('skillDie'),
  valueDie: $('valueDie'),
  redDiceGif: $('redDiceGif'),
  blueDiceGif: $('blueDiceGif'),
  skillCallout: $('skillCallout'),
  valueCallout: $('valueCallout'),
  boardResult: $('boardResult'),
  tapBubble: $('tapBubble'),
  tapBubbleText: $('tapBubbleText'),
  weaponPlaceholder: $('weaponPlaceholder'),
  stageStatus: $('stageStatus'),
  actionBannerText: $('actionBannerText'),
  actionBannerResult: $('actionBannerResult'),
  actionRoundLabel: $('actionRoundLabel'),
  actionCallout: $('actionCallout'),
  actionResultType: $('actionResultType'),
  actionResultValue: $('actionResultValue'),
  pawFill: $('pawFill'),
  pawTrack: document.querySelector('.paw-track'),
  targetField: $('targetField'),
  holeGrid: $('holeGrid'),
  countdownOverlay: $('countdownOverlay'),
  countdownValue: $('countdownValue'),
  moleTimerFill: $('moleTimerFill'),
  moleTimerText: $('moleTimerText'),
  moleStatus: $('moleStatus'),
  moleHammer: $('moleHammer'),
  coinLayer: $('coinLayer'),
  roundCompleteButton: $('roundCompleteButton'),
  actionStatus: $('actionStatus'),
  devState: $('devState'),
  devLog: $('devLog'),
  stage1BearArt: $('stage1BearArt'),
  stage1ChestArt: $('stage1ChestArt'),
  stage2BearArt: $('stage2BearArt'),
  stage2ChestArt: $('stage2ChestArt'),
  stage3BearArt: $('stage3BearArt'),
  stage3ChestArt: $('stage3ChestArt'),
  actionHouseBuildVideo: $('actionHouseBuildVideo'),
  actionHouseBuildCanvas: $('actionHouseBuildCanvas'),
  finalScreen: $('finalScreen'),
  finalVideo: $('finalVideo'),
};

const audio = {
  background: new Audio('./assets/audio/background.mp3'),
  hit: new Audio('./assets/audio/hit.mp3'),
  victory: new Audio('./assets/audio/victory.mp3'),
};
audio.background.loop = true;
audio.background.volume = .28;
audio.hit.volume = .62;
audio.victory.volume = .58;
function playEffect(sound) {
  sound.currentTime = 0;
  void sound.play().catch(() => {});
}
function startBackgroundMusic() {
  if (audio.background.paused) void audio.background.play().catch(() => {});
}
function playVictory() {
  audio.background.pause();
  audio.background.currentTime = 0;
  playEffect(audio.victory);
}
const ROUND_DICE_ANIMATIONS = Object.freeze({
  1: [
    { canvas: elements.redDiceGif, framePath: './assets/dice/r1-red3-frames', frameCount: 10 },
    { canvas: elements.blueDiceGif, framePath: './assets/dice/r1-blue4-frames', frameCount: 9 },
  ],
  2: [
    { canvas: elements.redDiceGif, framePath: './assets/dice/red-frames', frameCount: 9 },
    { canvas: elements.blueDiceGif, framePath: './assets/dice/blue-frames', frameCount: 8 },
  ],
  3: [
    { canvas: elements.redDiceGif, framePath: './assets/dice/r3-red6-frames', frameCount: 9 },
    { canvas: elements.blueDiceGif, framePath: './assets/dice/r3-blue6-frames', frameCount: 9 },
  ],
});
const ROUND_DICE_PLAY_MS = 500;

const STAGE_ART_ANIMATIONS = [
  { element: elements.stage1BearArt, path: './assets/action-stage1-bear-frames', frameCount: 13, frameMs: 67 },
  { element: elements.stage1ChestArt, path: './assets/action-stage1-chest-frames', frameCount: 14, frameMs: 67 },
  { element: elements.stage2BearArt, path: './assets/action-stage2-bear-frames', frameCount: 17, frameMs: 67 },
  { element: elements.stage2ChestArt, path: './assets/action-stage2-chest-frames', frameCount: 13, frameMs: 67 },
  { element: elements.stage3BearArt, path: './assets/action-stage3-bear-frames', frameCount: 23, frameMs: 67 },
  { element: elements.stage3ChestArt, path: './assets/action-stage3-chest-frames', frameCount: 13, frameMs: 67 },
];

for (const animation of STAGE_ART_ANIMATIONS) {
  const frames = Array.from({ length: animation.frameCount }, (_, index) => {
    const image = new Image();
    image.src = `${animation.path}/${String(index).padStart(3, '0')}.png?v=2`;
    return image;
  });
  let currentFrame = -1;
  const render = (now) => {
    const nextFrame = Math.floor(now / animation.frameMs) % animation.frameCount;
    if (nextFrame !== currentFrame) {
      currentFrame = nextFrame;
      animation.element.src = frames[nextFrame].src;
    }
    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
}

let buildVideoFrameId = 0;

const stopTransparentBuildVideo = () => {
  if (buildVideoFrameId) window.cancelAnimationFrame(buildVideoFrameId);
  buildVideoFrameId = 0;
};

const renderTransparentBuildVideo = () => {
  const video = elements.actionHouseBuildVideo;
  const canvas = elements.actionHouseBuildCanvas;
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    if (!video.paused && !video.ended) buildVideoFrameId = window.requestAnimationFrame(renderTransparentBuildVideo);
    return;
  }
  const maxWidth = 640;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, width, height);
  context.drawImage(video, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const brightness = Math.max(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
    if (brightness < 18) pixels.data[index + 3] = 0;
    else if (brightness < 58) pixels.data[index + 3] = Math.round(((brightness - 18) / 40) * 255);
  }
  context.putImageData(pixels, 0, 0);
  if (!video.paused && !video.ended) buildVideoFrameId = window.requestAnimationFrame(renderTransparentBuildVideo);
};

const playThirdRoundBuildSequence = () => new Promise((resolve) => {
  const video = elements.actionHouseBuildVideo;
  const root = elements.gameRoot;
  let finished = false;
  const showBuiltHouse = () => {
    if (finished) return;
    finished = true;
    stopTransparentBuildVideo();
    video.pause();
    root.classList.remove('is-building-house');
    root.classList.add('is-house-built');
    window.setTimeout(resolve, 2000);
  };
  root.classList.remove('is-house-built');
  root.classList.add('is-building-house');
  video.currentTime = 0;
  video.addEventListener('ended', showBuiltHouse, { once: true });
  video.addEventListener('error', showBuiltHouse, { once: true });
  video.play().then(() => {
    stopTransparentBuildVideo();
    renderTransparentBuildVideo();
  }).catch(showBuiltHouse);
});
const MOLE_HOLE_FRAMES = Array.from({ length: 9 }, (_, index) => {
  const image = new Image();
  image.src = `./assets/mole-hole-frames/${String(index).padStart(3, '0')}.png?v=1`;
  return image;
});
const moleHoleCanvases = Array.from(document.querySelectorAll('.mole-hole-art'));
let renderedMoleHoleFrame = -1;
const renderMoleHoleAnimation = (now) => {
  const frameIndex = Math.floor(now / 120) % MOLE_HOLE_FRAMES.length;
  if (frameIndex !== renderedMoleHoleFrame) {
    renderedMoleHoleFrame = frameIndex;
    const frame = MOLE_HOLE_FRAMES[frameIndex];
    if (frame.complete && frame.naturalWidth) {
      for (const canvas of moleHoleCanvases) {
        if (canvas.width !== 152 || canvas.height !== 96) {
          canvas.width = 152;
          canvas.height = 96;
        }
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      }
    }
  }
  window.requestAnimationFrame(renderMoleHoleAnimation);
};
window.requestAnimationFrame(renderMoleHoleAnimation);
const loadMoleStateFrames = (path, count) => Array.from({ length: count }, (_, index) => {
  const image = new Image();
  image.src = `${path}/${String(index).padStart(3, '0')}.png?v=1`;
  return image;
});
const MOLE_STATE_FRAMES = Object.freeze({
  emerge: loadMoleStateFrames('./assets/mole-emerge-frames', 6),
  idle: loadMoleStateFrames('./assets/mole-idle-frames', 4),
  hit: loadMoleStateFrames('./assets/mole-hit-frames', 4),
  half: loadMoleStateFrames('./assets/mole-half-frames', 3),
});
const MOLE_IMPACT_FRAME = loadMoleStateFrames('./assets/mole-impact-frames', 1)[0];
const moleStateArt = Array.from(document.querySelectorAll('.mole-state-art')).map((canvas) => ({
  canvas,
  target: canvas.parentElement.querySelector('.mole-target'),
  state: 'hidden',
  startedAt: 0,
}));
const moleImpactArt = Array.from(document.querySelectorAll('.mole-hit-effect-art')).map((canvas) => ({ canvas, startedAt: -Infinity }));
const playMoleHitEffect = (index) => {
  const entry = moleImpactArt[index];
  if (entry) entry.startedAt = performance.now();
};
const drawMoleStateArt = (entry, frame) => {
  if (!frame.complete || !frame.naturalWidth) return;
  const { canvas } = entry;
  if (canvas.width !== 176 || canvas.height !== 160) {
    canvas.width = 176;
    canvas.height = 160;
  }
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(frame, 0, 0, canvas.width, canvas.height);
};
const renderMoleImpactEffects = (now) => {
  for (const entry of moleImpactArt) {
    const elapsed = now - entry.startedAt;
    if (elapsed < 0 || elapsed > 420 || !MOLE_IMPACT_FRAME.complete || !MOLE_IMPACT_FRAME.naturalWidth) {
      entry.canvas.style.opacity = '0';
      continue;
    }
    if (entry.canvas.width !== 120 || entry.canvas.height !== 120) {
      entry.canvas.width = 120;
      entry.canvas.height = 120;
    }
    const context = entry.canvas.getContext('2d');
    context.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
    context.drawImage(MOLE_IMPACT_FRAME, 0, 0, entry.canvas.width, entry.canvas.height);
    const progress = elapsed / 420;
    entry.canvas.style.opacity = `${1 - progress}`;
    entry.canvas.style.transform = `scale(${.8 + progress * .35})`;
  }
  window.requestAnimationFrame(renderMoleImpactEffects);
};
const renderMoleStateAnimation = (now) => {
  const roundId = Number(elements.gameRoot.dataset.roundId);
  const useStateArt = roundId === 1 || roundId === 2 || roundId === 3;
  for (const entry of moleStateArt) {
    const nextState = !useStateArt || !entry.target.classList.contains('is-up')
      ? 'hidden'
      : entry.target.classList.contains('is-hit') ? 'hit'
      : roundId === 2 && entry.target.classList.contains('is-damaged') ? 'damaged' : 'up';
    if (entry.state !== nextState) {
      entry.state = nextState;
      entry.startedAt = now;
    }
    if (nextState === 'hidden') {
      const context = entry.canvas.getContext('2d');
      context.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
      continue;
    }
    const elapsed = now - entry.startedAt;
    const frames = nextState === 'hit'
      ? MOLE_STATE_FRAMES.hit
      : nextState === 'damaged' ? MOLE_STATE_FRAMES.half
      : elapsed < 480 ? MOLE_STATE_FRAMES.emerge : MOLE_STATE_FRAMES.idle;
    const frameMs = frames === MOLE_STATE_FRAMES.idle ? 120 : 80;
    const frameIndex = nextState === 'hit'
      ? Math.min(frames.length - 1, Math.floor(elapsed / frameMs))
      : Math.floor(elapsed / frameMs) % frames.length;
    drawMoleStateArt(entry, frames[frameIndex]);
  }
  window.requestAnimationFrame(renderMoleStateAnimation);
};
window.requestAnimationFrame(renderMoleStateAnimation);
window.requestAnimationFrame(renderMoleImpactEffects);
// Preserve the video end card instead of looping back to its first frame.
elements.finalVideo?.addEventListener('ended', () => {
  const finalMoment = Math.max(0, elements.finalVideo.duration - .05);
  if (Number.isFinite(finalMoment)) elements.finalVideo.currentTime = finalMoment;
  elements.finalVideo.pause();
});
const dicePlayersByRound = new Map();

const createDicePlayers = (roundId) => (ROUND_DICE_ANIMATIONS[roundId] ?? []).map((animation) => {
  const context = animation.canvas.getContext("2d");
  const frames = Array.from({ length: animation.frameCount }, (_, index) => {
    const image = new Image();
    image.src = animation.framePath + "/" + String(index).padStart(3, "0") + ".png?v=c27bc6d";
    return image;
  });
  return { ...animation, context, frames };
});

const getDicePlayers = (roundId) => {
  if (!dicePlayersByRound.has(roundId)) dicePlayersByRound.set(roundId, createDicePlayers(roundId));
  return dicePlayersByRound.get(roundId);
};

const preloadDiceRound = (roundId) => {
  const players = getDicePlayers(roundId);
  return Promise.all(players.flatMap((player) => player.frames.map((frame) => new Promise((resolve) => {
    if (frame.complete) {
      resolve(frame.naturalWidth > 0);
      return;
    }
    frame.addEventListener("load", () => resolve(true), { once: true });
    frame.addEventListener("error", () => resolve(false), { once: true });
  })))).then((loaded) => loaded.every(Boolean));
};

let diceAnimationStartedAt = null;
let activeDicePlayers = [];

const renderDiceAnimation = (now) => {
  if (diceAnimationStartedAt !== null) {
    const progress = Math.min(1, (now - diceAnimationStartedAt) / ROUND_DICE_PLAY_MS);
    for (const player of activeDicePlayers) {
      const frameIndex = Math.min(player.frameCount - 1, Math.floor(progress * (player.frameCount - 1)));
      const frame = player.frames[frameIndex];
      if (!frame.complete || !frame.naturalWidth) continue;
      player.context.clearRect(0, 0, player.canvas.width, player.canvas.height);
      player.context.drawImage(frame, 0, 0, player.canvas.width, player.canvas.height);
    }
  }
  window.requestAnimationFrame(renderDiceAnimation);
};

const restartRoundDice = (roundId) => {
  elements.gameRoot.classList.remove("dice-animation-active", "dice-animation-ready", "dice-animation-preview");
  activeDicePlayers = getDicePlayers(roundId);
  diceAnimationStartedAt = performance.now();
  elements.gameRoot.classList.add("dice-animation-active");

  preloadDiceRound(roundId).then((ready) => {
    if (ready && activeDicePlayers === getDicePlayers(roundId)) {
      diceAnimationStartedAt = performance.now();
      elements.gameRoot.classList.add("dice-animation-ready");
    }
  });
};

window.requestAnimationFrame(renderDiceAnimation);

const showDicePreview = (roundId) => {
  const players = getDicePlayers(roundId);
  preloadDiceRound(roundId).then((ready) => {
    if (!ready || elements.gameRoot.classList.contains("dice-animation-active")) return;
    for (const player of players) {
      const frame = player.frames[0];
      player.context.clearRect(0, 0, player.canvas.width, player.canvas.height);
      player.context.drawImage(frame, 0, 0, player.canvas.width, player.canvas.height);
    }
    elements.gameRoot.classList.add("dice-animation-preview");
  });
};

const dicePreviewObserver = new MutationObserver(() => {
  if (!elements.gameRoot.classList.contains("dice-animation-active")) {
    showDicePreview(Number(elements.gameRoot.dataset.roundId));
  }
});
dicePreviewObserver.observe(elements.gameRoot, { attributes: true, attributeFilter: ["data-round-id"] });

window.setTimeout(() => { showDicePreview(1); }, 0);
let controller;
const moleRound = new MoleRoundController(elements, {
  onLog(event) {
    elements.devLog.textContent = `${JSON.stringify(event)}\n${elements.devLog.textContent}`.slice(0, 4800);
  },
  onComplete(result) {
    playVictory();
    if (result.round === 3) {
      void playThirdRoundBuildSequence().then(() => controller?.enableRoundComplete(result, 0));
      return;
    }
    controller?.enableRoundComplete(result);
  },
  onHit(index) {
    playEffect(audio.hit);
    if (Number.isInteger(index)) playMoleHitEffect(index);
  },
});

controller = new DiceStageController(elements, {
  onLog(event) {
    elements.devLog.textContent = `${JSON.stringify(event)}\n${elements.devLog.textContent}`.slice(0, 4800);
  },
  moleRound,
});

elements.rollButton.addEventListener('click', () => {
  if (controller.state === 'READY') restartRoundDice(controller.currentRound.id);
  startBackgroundMusic();
  controller.roll();
});
elements.roundCompleteButton.addEventListener('click', () => controller.completeRound());
elements.gameRoot.addEventListener('pointerdown', (event) => controller.handlePointerStart(event.clientY));
elements.gameRoot.addEventListener('pointerup', (event) => controller.handlePointerEnd(event.clientY));
document.getElementById('resetButton').addEventListener('click', () => controller.reset());

controller.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    }).catch(() => {});
  });
}
