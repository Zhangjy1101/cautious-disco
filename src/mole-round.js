const COUNTDOWN_STEP_MS = 1000;
const TICK_MS = 100;

export const MOLE_ROUND_CONFIGS = Object.freeze({
  1: Object.freeze({
    durationMs: 10000,
    burstTimesMs: Object.freeze([3000, 6000, 9000]),
    burstCounts: Object.freeze([4, 8, 13]),
    hitsRequired: 1,
    spawnMin: 1,
    spawnMax: 2,
    areaHit: false,
    moleVisibleMinMs: 1250,
    moleVisibleRangeMs: 450,
    startPercent: 0,
    endPercent: 25,
    hammer: 'flame',
  }),
  2: Object.freeze({
    durationMs: 5000,
    burstTimesMs: Object.freeze([2000, 4000]),
    burstCounts: Object.freeze([2, 3]),
    hitsRequired: 2,
    spawnMin: 1,
    spawnMax: 2,
    areaHit: false,
    moleVisibleMinMs: 1750,
    moleVisibleRangeMs: 550,
    startPercent: 25,
    endPercent: 30,
    hammer: 'tiny',
  }),
  3: Object.freeze({
    durationMs: 10000,
    burstTimesMs: Object.freeze([]),
    burstCounts: Object.freeze([]),
    hitsRequired: 1,
    spawnMin: 3,
    spawnMax: 4,
    areaHit: true,
    smashCoinBase: 3,
    smashCoinStep: 2,
    moleVisibleMinMs: 2250,
    moleVisibleRangeMs: 500,
    startPercent: 30,
    endPercent: 100,
    hammer: 'mega',
  }),
});

export class MoleRoundController {
  constructor(elements, { onLog = () => {}, onComplete = () => {}, onHit = () => {} } = {}) {
    this.el = elements;
    this.onLog = onLog;
    this.onComplete = onComplete;
    this.onHit = onHit;
    this.state = 'IDLE';
    this.round = null;
    this.config = null;
    this.flowToken = 0;
    this.timerIds = new Set();
    this.activeHoles = new Set();
    this.hammerTimerId = null;
    this.elapsedMs = 0;
    this.coinBursts = 0;
    this.coinCount = 0;
    this.isComplete = false;
    this.shakeTimerId = null;
    this.hitShakeTimerId = null;
    this.pointerHeld = false;

    this.holes.forEach((hole, index) => {
      hole.addEventListener('click', (event) => {
        if (event?.detail > 0) return;
        this.hitMole(index);
      });
    });
    this.el.targetField?.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    this.el.targetField?.addEventListener('pointerup', () => this.handlePointerUp());
    this.el.targetField?.addEventListener('pointercancel', () => this.handlePointerUp());
    this.el.targetField?.addEventListener('click', (event) => {
      if (event?.detail > 0) return;
      this.smashField();
    });
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('pointerup', () => this.handlePointerUp());
      window.addEventListener('pointercancel', () => this.handlePointerUp());
    }
  }

  get holes() {
    return this.el.holeGrid ? [...this.el.holeGrid.querySelectorAll('.mole-target')] : [];
  }

  start(round) {
    this.stop();
    this.round = round;
    this.config = MOLE_ROUND_CONFIGS[round?.id] ?? null;
    if (!this.config) {
      this.state = 'PLACEHOLDER';
      return;
    }

    const token = ++this.flowToken;
    this.isComplete = false;
    this.state = 'COUNTDOWN';
    this.elapsedMs = 0;
    this.coinBursts = 0;
    this.coinCount = 0;
    this.resetVisuals(this.config);
    this.el.countdownOverlay.classList.remove('is-hidden');
    this.el.countdownValue.textContent = '3';
    this.el.moleStatus.textContent = 'GET READY';
    this.el.actionStatus.textContent = `Round ${round.id} starts after the countdown.`;
    this.el.moleTimerFill.style.width = '100%';
    this.el.moleTimerText.textContent = this.formatSeconds(this.config.durationMs);
    this.el.pawFill.style.height = `${this.config.startPercent}%`;
    this.el.moleHammer.className = `mole-hammer weapon-${this.config.hammer}`;
    this.log('mole_countdown_start', { round: round.id });

    this.schedule(() => this.updateCountdown(token, '2'), COUNTDOWN_STEP_MS);
    this.schedule(() => this.updateCountdown(token, '1'), COUNTDOWN_STEP_MS * 2);
    this.schedule(() => {
      if (!this.isCurrent(token, 'COUNTDOWN')) return;
      this.el.countdownOverlay.classList.add('is-hidden');
      this.startGameplay(token);
    }, COUNTDOWN_STEP_MS * 3);
  }

  updateCountdown(token, value) {
    if (!this.isCurrent(token, 'COUNTDOWN')) return;
    this.el.countdownValue.textContent = value;
    this.el.countdownValue.classList.remove('countdown-pop-reset');
    void this.el.countdownValue.offsetWidth;
    this.el.countdownValue.classList.add('countdown-pop-reset');
    this.log('mole_countdown_tick', { value });
  }

  startGameplay(token) {
    if (!this.isCurrent(token, 'COUNTDOWN')) return;
    this.state = 'ACTIVE';
    this.el.moleStatus.textContent = this.config.areaHit ? 'TAP THE FIELD' : 'TAP THE MOLES';
    this.el.actionStatus.textContent = this.config.areaHit
      ? 'Tap the nine-hole field to smash every visible mole.'
      : this.config.hitsRequired === 2
        ? 'Each mole needs two hits before the 5 second timer ends.'
        : 'Hit the moles before the 10 second timer ends.';
    if (this.config.areaHit) this.el.targetField.classList.add('is-area-active');
    else this.el.targetField.classList.remove('is-area-active');
    this.spawnBatch(token);
    this.schedule(() => this.tick(token), TICK_MS);
    this.schedule(() => this.spawnLoop(token), 760);
    this.config.burstTimesMs.forEach((timeMs, index) => {
      this.schedule(() => this.burstCoins(token, index), timeMs);
    });
    this.log('mole_round_start', {
      round: this.round.id,
      duration_ms: this.config.durationMs,
      hits_required: this.config.hitsRequired,
    });
  }

  tick(token) {
    if (!this.isCurrent(token, 'ACTIVE')) return;
    this.elapsedMs += TICK_MS;
    const remainingMs = Math.max(0, this.config.durationMs - this.elapsedMs);
    this.el.moleTimerFill.style.width = `${(remainingMs / this.config.durationMs) * 100}%`;
    this.el.moleTimerText.textContent = this.formatSeconds(remainingMs);
    if (remainingMs <= 0) {
      this.finish(token);
      return;
    }
    this.schedule(() => this.tick(token), TICK_MS);
  }

  spawnLoop(token) {
    if (!this.isCurrent(token, 'ACTIVE')) return;
    this.spawnBatch(token);
    const delay = 650 + Math.round(Math.random() * 450);
    this.schedule(() => this.spawnLoop(token), delay);
  }

  spawnBatch(token) {
    if (!this.isCurrent(token, 'ACTIVE')) return;
    if (this.config.areaHit && this.activeHoles.size) return;
    const candidates = this.holes
      .map((_, index) => index)
      .filter((index) => !this.activeHoles.has(index));
    if (!candidates.length) return;
    const amount = Math.min(candidates.length, this.config.spawnMin + Math.floor(Math.random() * (this.config.spawnMax - this.config.spawnMin + 1)));
    const visibleMs = this.config.areaHit
      ? this.config.moleVisibleMinMs + Math.round(Math.random() * this.config.moleVisibleRangeMs)
      : null;
    for (let i = 0; i < amount; i += 1) {
      const pick = Math.floor(Math.random() * candidates.length);
      const index = candidates.splice(pick, 1)[0];
      this.showMole(index, token, visibleMs);
    }
  }

  showMole(index, token, visibleMs = null) {
    const mole = this.holes[index];
    if (!mole || !this.isCurrent(token, 'ACTIVE')) return;
    this.activeHoles.add(index);
    mole.dataset.hitStage = '0';
    mole.classList.remove('is-damaged', 'is-hit');
    mole.classList.add('is-up');
    const hideToken = this.flowToken;
    this.schedule(() => {
      if (hideToken !== this.flowToken || !this.activeHoles.has(index)) return;
      this.hideMole(index);
    }, visibleMs ?? this.config.moleVisibleMinMs + Math.round(Math.random() * this.config.moleVisibleRangeMs));
  }

  hitMole(index) {
    if (this.config?.areaHit) return;
    if (this.state !== 'ACTIVE' || !this.activeHoles.has(index)) return;
    const mole = this.holes[index];
    if (!mole || mole.classList.contains('is-hit')) return;
    const hitStage = Number(mole.dataset.hitStage ?? 0) + 1;
    mole.dataset.hitStage = `${hitStage}`;
    this.positionHammer(index);
    this.onHit(index);
    if (this.round?.id === 2) this.smallHitShake();

    if (hitStage < this.config.hitsRequired) {
      mole.classList.add('is-damaged');
      this.el.moleStatus.textContent = `HIT ${hitStage} / ${this.config.hitsRequired}`;
      this.log('mole_hit_stage', {
        hole: index + 1,
        hit_stage: hitStage,
        hits_required: this.config.hitsRequired,
        elapsed_ms: this.elapsedMs,
      });
      return;
    }

    this.activeHoles.delete(index);
    mole.classList.remove('is-damaged');
    mole.classList.add('is-hit');
    this.el.moleStatus.textContent = this.config.hitsRequired === 2 ? 'MOLE DOWN!' : 'HIT!';
    this.log('mole_hit', {
      hole: index + 1,
      hit_stage: hitStage,
      hits_required: this.config.hitsRequired,
      elapsed_ms: this.elapsedMs,
    });
    this.schedule(() => {
      mole.dataset.hitStage = '0';
      mole.classList.remove('is-damaged', 'is-hit', 'is-up');
      if (this.state === 'ACTIVE') this.el.moleStatus.textContent = 'TAP THE MOLES';
    }, 430);
  }

  handlePointerDown(event) {
    if (this.state !== 'ACTIVE') return;
    this.pointerHeld = true;
    if (event?.currentTarget?.setPointerCapture && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (this.config?.areaHit) {
      this.smashField();
      return;
    }

    const target = event?.target?.closest?.('.mole-target');
    const index = target ? this.holes.indexOf(target) : -1;
    if (index >= 0) this.hitMole(index);
  }

  handlePointerUp() {
    if (!this.pointerHeld) return;
    this.pointerHeld = false;
    this.hideHammer();
  }

  smashField() {
    if (this.state !== 'ACTIVE' || !this.config?.areaHit || !this.activeHoles.size) return;
    const smashedHoles = [...this.activeHoles];
    this.positionAreaHammer();
    
    this.shakeScreen();

    smashedHoles.forEach((index) => {
      const mole = this.holes[index];
      this.activeHoles.delete(index);
      if (!mole) return;
      mole.dataset.hitStage = '1';
      mole.classList.remove('is-damaged');
      mole.classList.add('is-hit');
      this.onHit(index);
      this.schedule(() => {
        mole.dataset.hitStage = '0';
        mole.classList.remove('is-hit', 'is-up');
      }, 480);
    });

    const count = this.config.smashCoinBase + this.coinBursts * this.config.smashCoinStep;
    this.emitCoins(count, this.coinBursts, 'mega_smash');
    this.el.moleStatus.textContent = `MEGA SMASH x${smashedHoles.length}`;
    this.log('mega_smash', {
      smashed_moles: smashedHoles.length,
      smash_number: this.coinBursts,
      coin_count: count,
      elapsed_ms: this.elapsedMs,
    });
  }

  hideMole(index) {
    const mole = this.holes[index];
    this.activeHoles.delete(index);
    if (!mole) return;
    mole.dataset.hitStage = '0';
    mole.classList.remove('is-up', 'is-damaged', 'is-hit');
  }

  positionHammer(index) {
    const mole = this.holes[index];
    if (!mole) return;
    const fieldRect = this.el.targetField.getBoundingClientRect();
    const moleRect = mole.getBoundingClientRect();
    this.el.moleHammer.style.left = `${moleRect.left - fieldRect.left + moleRect.width / 2}px`;
    this.el.moleHammer.style.top = `${moleRect.top - fieldRect.top + moleRect.height / 2}px`;
    this.showHammer(this.pointerHeld ? null : 260);
  }

  positionAreaHammer() {
    this.el.moleHammer.style.left = '50%';
    this.el.moleHammer.style.top = '48%';
    this.showHammer(this.pointerHeld ? null : 260);
  }

  showHammer(fallbackHideMs = 260) {
    this.el.moleHammer.classList.remove('is-visible');
    void this.el.moleHammer.offsetWidth;
    this.el.moleHammer.classList.add('is-visible');
    if (this.hammerTimerId) window.clearTimeout(this.hammerTimerId);
    if (fallbackHideMs === null) {
      this.hammerTimerId = null;
      return;
    }
    this.hammerTimerId = window.setTimeout(() => {
      this.hideHammer();
    }, fallbackHideMs);
  }

  hideHammer() {
    if (this.hammerTimerId) window.clearTimeout(this.hammerTimerId);
    this.hammerTimerId = null;
    this.el.moleHammer.classList.remove('is-visible');
  }

  shakeScreen() {
    this.el.gameRoot.classList.remove('is-shaking');
    this.el.targetField.classList.remove('is-smashed');
    void this.el.gameRoot.offsetWidth;
    this.el.gameRoot.classList.add('is-shaking');
    this.el.targetField.classList.add('is-smashed');
    if (this.shakeTimerId) window.clearTimeout(this.shakeTimerId);
    this.shakeTimerId = window.setTimeout(() => {
      this.el.gameRoot.classList.remove('is-shaking');
      this.el.targetField.classList.remove('is-smashed');
      this.shakeTimerId = null;
    this.hitShakeTimerId = null;
    }, 320);
  }

  smallHitShake() {
    this.el.gameRoot.classList.remove('is-mole-hit-shaking');
    void this.el.gameRoot.offsetWidth;
    this.el.gameRoot.classList.add('is-mole-hit-shaking');
    if (this.hitShakeTimerId) window.clearTimeout(this.hitShakeTimerId);
    this.hitShakeTimerId = window.setTimeout(() => {
      this.el.gameRoot.classList.remove('is-mole-hit-shaking');
      this.hitShakeTimerId = null;
    }, 170);
  }
  burstCoins(token, burstIndex) {
    if (!this.isCurrent(token, 'ACTIVE')) return;
    const count = this.config.burstCounts[burstIndex];
    this.emitCoins(count, burstIndex, 'timer');
  }

  emitCoins(count, burstIndex, source) {
    const positions = this.coinPositions(count, burstIndex);
    for (let i = 0; i < count; i += 1) {
      const coin = this.el.coinLayer.ownerDocument.createElement('span');
      coin.className = 'coin-token';
      coin.style.setProperty('--coin-x', `${positions[i].x}%`);
      coin.style.setProperty('--coin-y', `${positions[i].y}%`);
      coin.style.setProperty('--coin-size', `${positions[i].size}px`);
      coin.style.setProperty('--coin-rotation', `${positions[i].rotation}deg`);
      coin.style.setProperty('--coin-delay', `${i * 28}ms`);
      this.el.coinLayer.appendChild(coin);
      this.coinCount += 1;
    }
    this.coinBursts += 1;
    this.el.moleStatus.textContent = `COINS x${this.coinBursts}`;
    this.log('coin_burst', { burst: this.coinBursts, count, source });
  }

  coinPositions(count, burstIndex) {
    const positions = [];
    for (let i = 0; i < count; i += 1) {
      const side = (i + burstIndex) % 4;
      const along = 7 + ((i * 19 + burstIndex * 11) % 84);
      const x = side === 0 ? along : side === 1 ? 88 + (i % 4) : side === 2 ? along : 5 + (i % 4);
      const y = side === 0 ? 7 + (i % 12) : side === 1 ? along : side === 2 ? 78 + (i % 12) : along;
      positions.push({ x, y, size: 16 + ((i + burstIndex) % 3) * 3, rotation: -25 + ((i * 37) % 70) });
    }
    return positions;
  }

  collectCoinsToMeter() {
    const layerRect = this.el.coinLayer.getBoundingClientRect();
    const trackRect = this.el.pawTrack.getBoundingClientRect();
    const targetX = trackRect.left + trackRect.width / 2 - layerRect.left;
    const targetY = trackRect.bottom - layerRect.top - 9;
    for (const coin of this.el.coinLayer.querySelectorAll('.coin-token')) {
      coin.style.setProperty('--collect-x', `${targetX}px`);
      coin.style.setProperty('--collect-y', `${targetY}px`);
    }
    this.el.coinLayer.classList.add('is-collecting');
  }

  settleMeter(percent) {
    this.el.pawFill.classList.remove('is-surging', 'is-filling');
    void this.el.pawFill.offsetWidth;
    this.el.pawFill.classList.add('is-filling');
    this.el.pawFill.style.height = `${percent}%`;
  }
  finish(token) {
    if (!this.isCurrent(token, 'ACTIVE')) return;
    this.state = 'SETTLING';
    this.clearTimers();
    if (this.hammerTimerId) window.clearTimeout(this.hammerTimerId);
    this.hammerTimerId = null;
    if (this.shakeTimerId) window.clearTimeout(this.shakeTimerId);
    this.shakeTimerId = null;
    this.hitShakeTimerId = null;
    this.el.moleHammer.classList.remove('is-visible');
    this.el.gameRoot.classList.remove('is-shaking');
    this.el.targetField.classList.remove('is-smashed', 'is-area-active');
    this.activeHoles.forEach((index) => this.hideMole(index));
    this.el.moleTimerFill.style.width = '0%';
    this.el.moleTimerText.textContent = '0.0s';
    this.log('mole_round_timeout', { round: this.round.id, coin_bursts: this.coinBursts, coin_count: this.coinCount });

    if (this.config.areaHit) {
      this.finishMegaRound(token);
      return;
    }

    this.el.moleStatus.textContent = 'COLLECTING COINS';
    this.el.actionStatus.textContent = 'All coins are moving into the paw meter.';
    this.collectCoinsToMeter();
    this.schedule(() => {
      this.state = 'COMPLETE';
      this.isComplete = true;
      const gainedPercent = this.config.endPercent - this.config.startPercent;
      this.el.coinLayer.replaceChildren();
      this.el.coinLayer.classList.remove('is-collecting');
      this.settleMeter(this.config.endPercent);
      this.el.moleStatus.textContent = `${this.config.endPercent}% STORED`;
      this.el.actionStatus.textContent = `${this.config.durationMs / 1000} seconds complete. Round ${this.round.id} adds ${gainedPercent}%, total ${this.config.endPercent}%.`;
      this.onComplete({
        round: this.round.id,
        coinBursts: this.coinBursts,
        coinCount: this.coinCount,
        gainedPercent,
        endPercent: this.config.endPercent,
      });
      this.log('mole_round_complete', { round: this.round.id, vault_percent: this.config.endPercent });
    }, 850);
  }

  finishMegaRound(token) {
    this.el.moleStatus.textContent = 'COLLECTING COINS';
    this.el.actionStatus.textContent = 'All coins are moving into the progress bar.';
    this.collectCoinsToMeter();

    this.schedule(() => {
      if (!this.isCurrent(token, 'SETTLING')) return;
      this.settleMeter(100);
      this.el.moleStatus.textContent = '100% JACKPOT';
      this.el.actionStatus.textContent = 'The progress bar is full.';
      this.log('mega_meter_surge', { round: this.round.id, from_percent: 30, to_percent: 100 });
    }, 850);

    this.schedule(() => {
      if (!this.isCurrent(token, 'SETTLING')) return;
      this.state = 'COMPLETE';
      this.isComplete = true;
      const gainedPercent = this.config.endPercent - this.config.startPercent;
      this.el.coinLayer.replaceChildren();
      this.el.coinLayer.classList.remove('is-fireworks', 'is-collecting');
      this.onComplete({
        round: this.round.id,
        coinBursts: this.coinBursts,
        coinCount: this.coinCount,
        gainedPercent,
        endPercent: this.config.endPercent,
      });
      this.log('mole_round_complete', { round: this.round.id, vault_percent: this.config.endPercent });
    }, 1700);
  }
  launchCoinFireworks() {
    const count = Math.max(24, this.coinCount);
    this.el.coinLayer.replaceChildren();
    this.el.coinLayer.classList.remove('is-collecting');
    this.el.coinLayer.classList.add('is-fireworks');

    for (let i = 0; i < count; i += 1) {
      const coin = this.el.coinLayer.ownerDocument.createElement('span');
      const angle = (Math.PI * 2 * i) / count + (i % 3) * .09;
      const distance = 82 + (i % 7) * 16;
      coin.className = 'coin-token coin-firework';
      coin.style.setProperty('--coin-size', `${14 + (i % 4) * 3}px`);
      coin.style.setProperty('--firework-x', `${Math.cos(angle) * distance}px`);
      coin.style.setProperty('--firework-y', `${Math.sin(angle) * distance}px`);
      coin.style.setProperty('--firework-spin', `${540 + (i % 5) * 140}deg`);
      coin.style.setProperty('--coin-delay', `${(i % 12) * 24}ms`);
      this.el.coinLayer.appendChild(coin);
    }
  }

  stop() {
    this.clearTimers();
    this.flowToken += 1;
    this.state = 'IDLE';
    this.isComplete = false;
    this.pointerHeld = false;
    this.activeHoles.clear();
    if (this.hammerTimerId) window.clearTimeout(this.hammerTimerId);
    this.hammerTimerId = null;
    if (this.shakeTimerId) window.clearTimeout(this.shakeTimerId);
    this.shakeTimerId = null;
    this.hitShakeTimerId = null;
    this.resetVisuals();
  }

  resetVisuals(config = this.config ?? MOLE_ROUND_CONFIGS[1]) {
    this.holes.forEach((mole) => {
      mole.dataset.hitStage = '0';
      mole.classList.remove('is-up', 'is-damaged', 'is-hit');
    });
    this.el.countdownOverlay.classList.add('is-hidden');
    this.el.countdownValue.textContent = '3';
    this.el.moleHammer.className = `mole-hammer weapon-${config.hammer}`;
    this.el.moleHammer.classList.remove('is-visible');
    this.el.gameRoot.classList.remove('is-shaking');
    this.el.targetField.classList.remove('is-smashed', 'is-area-active');
    this.el.pawFill.classList.remove('is-surging');
    this.el.coinLayer.classList.remove('is-collecting', 'is-fireworks');
    this.el.coinLayer.replaceChildren();
    this.el.moleTimerFill.style.width = '100%';
    this.el.moleTimerText.textContent = this.formatSeconds(config.durationMs);
    this.el.moleStatus.textContent = 'GET READY';
  }

  formatSeconds(durationMs) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  isCurrent(token, state) {
    return token === this.flowToken && this.state === state;
  }

  schedule(callback, delayMs) {
    const timerId = window.setTimeout(() => {
      this.timerIds.delete(timerId);
      callback();
    }, delayMs);
    this.timerIds.add(timerId);
  }

  clearTimers() {
    for (const timerId of this.timerIds) window.clearTimeout(timerId);
    this.timerIds.clear();
  }

  log(name, payload = {}) {
    this.onLog({ t: Math.round(performance.now()), name, ...payload });
  }
}
