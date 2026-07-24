const RESULT_HOLD_MS = 2000;
const SCREEN_SLIDE_MS = 760;
const AUTO_RETURN_DELAY_MS = 3000;

export const DICE_ROUNDS = Object.freeze([
  {
    id: 1,
    theme: 'positive',
    banner: 'FIRE!',
    skill: 'FIRE!',
    multiplier: 'x20',
    rollDurationMs: 1100,
    boardText: 'POSITIVE BUFF • x20',
    actionLabel: 'GOOD!',
    actionType: 'POSITIVE BUFF',
    tapPrompt: "Tap to decide the farm's fate!",
    weapon: 'flame',
    weaponLabel: 'Flame hammer',
    pawStartPercent: 0,
    pawEndPercent: 25,
    moleDurationSeconds: 10,
  },
  {
    id: 2,
    theme: 'negative',
    banner: 'Small',
    skill: 'Small',
    multiplier: 'x1',
    rollDurationMs: 1100,
    boardText: 'Small • x1',
    actionLabel: 'Hurry up!',
    actionType: 'Small',
    tapPrompt: 'Push on! Better boosts!',
    weapon: 'tiny',
    weaponLabel: 'Tiny wooden hammer',
    pawStartPercent: 25,
    pawEndPercent: 30,
    moleDurationSeconds: 5,
  },
  {
    id: 3,
    theme: 'super',
    banner: 'Dynamax',
    skill: 'Dynamax',
    multiplier: 'x99',
    rollDurationMs: 1100,
    boardText: 'Dynamax • x99',
    actionLabel: 'Total wipe!',
    actionType: 'Dynamax',
    tapPrompt: 'Keep going! Max power!',
    weapon: 'mega',
    weaponLabel: 'Golden mega hammer',
    pawStartPercent: 30,
    pawEndPercent: 100,
    moleDurationSeconds: 10,
  },
]);

export class DiceStageController {
  constructor(elements, { onLog = () => {}, moleRound = null } = {}) {
    this.el = elements;
    this.onLog = onLog;
    this.moleRound = moleRound;
    this.state = 'BOOT';
    this.roundIndex = 0;
    this.flowToken = 0;
    this.timerIds = new Set();
    this.pointerStartY = null;
  }

  get currentRound() {
    return DICE_ROUNDS[this.roundIndex];
  }

  start() {
    this.reset();
  }

  reset() {
    this.clearTimers();
    this.moleRound?.stop();
    this.flowToken += 1;
    this.roundIndex = 0;
    this.el.gameRoot.classList.remove('is-rolling', 'is-landed', 'show-action', 'show-final', 'dice-animation-active', 'is-building-house', 'is-house-built');
    this.el.finalScreen?.setAttribute('aria-hidden', 'true');
    this.el.finalVideo?.pause();
    this.el.actionScreen.setAttribute('aria-hidden', 'true');
    this.el.diceScreen.setAttribute('aria-hidden', 'false');
    this.prepareRound('reset');
  }

  prepareRound(reason = 'round_ready') {
    const round = this.currentRound;
    this.el.gameRoot.classList.remove('is-rolling', 'is-landed', 'show-action', 'show-final', 'dice-animation-active', 'is-building-house', 'is-house-built');
    this.el.finalScreen?.setAttribute('aria-hidden', 'true');
    this.el.finalVideo?.pause();
    this.el.gameRoot.dataset.rollTheme = round.theme;
    this.el.gameRoot.dataset.roundId = String(round.id);
    this.el.gameRoot.dataset.resultState = 'hidden';
    this.el.weaponPlaceholder.className = `weapon-placeholder weapon-${round.weapon}`;
    this.el.weaponPlaceholder.setAttribute('aria-label', round.weaponLabel);
    this.el.weaponPlaceholder.setAttribute('aria-hidden', 'true');
    this.el.diceScreen.setAttribute('aria-hidden', 'false');
    this.el.actionScreen.setAttribute('aria-hidden', 'true');
    this.el.rollButton.disabled = false;
    this.el.rollButton.classList.add('is-pulsing');
    this.el.roundCompleteButton.disabled = true;
    this.el.roundIndicator.textContent = `${round.id} / ${DICE_ROUNDS.length}`;
    this.el.bannerText.textContent = '';
    this.el.bannerResult.textContent = '';
    this.el.skillCallout.setAttribute('aria-label', '');
    this.el.valueCallout.setAttribute('aria-label', '');
    this.el.boardResult.textContent = '';
    this.el.tapBubbleText.textContent = "Tap to decide\nthe farm's fate!";
    this.el.tapBubble.classList.remove('is-hidden');
    this.el.rollButtonLabel.textContent = 'ROLL';
    this.el.stageStatus.textContent = 'Tap the button to reveal the dice result.';
    this.updateActionScreen(round);
    this.setState('READY', reason);
  }

  roll() {
    if (this.state !== 'READY') {
      this.log('roll_ignored', { state: this.state, reason: 'state_locked' });
      return;
    }

    const round = this.currentRound;
    const token = ++this.flowToken;
    this.setState('ROLLING', 'button_click');
    this.el.gameRoot.classList.remove('is-landed');
    void this.el.gameRoot.offsetWidth;
    this.el.gameRoot.classList.add('is-rolling');
    this.el.rollButton.disabled = true;
    this.el.rollButton.classList.remove('is-pulsing');
    this.el.rollButtonLabel.textContent = 'ROLLING';
    this.el.boardResult.textContent = '';
    this.el.stageStatus.textContent = 'Dice input and page switching are locked.';
    this.el.tapBubble.classList.add('is-hidden');
    this.log('dice_roll_start', { token, round: round.id, theme: round.theme });

    this.schedule(() => {
      if (!this.isCurrent(token, 'ROLLING')) return;
      this.el.gameRoot.classList.remove('is-rolling');
      this.el.gameRoot.classList.add('is-landed');
      this.el.gameRoot.dataset.resultState = 'visible';
      this.el.weaponPlaceholder.setAttribute('aria-hidden', 'false');
      this.el.bannerText.textContent = round.banner;
      this.el.bannerResult.textContent = round.multiplier;
      this.el.skillCallout.setAttribute('aria-label', round.skill);
      this.el.valueCallout.setAttribute('aria-label', round.multiplier);
      this.el.boardResult.textContent = `${round.boardText} LOCKED`;
      this.el.stageStatus.textContent = 'Result confirmed. Moving to part 2.';
      this.setState('RESULT', 'dice_landed');
      this.log('dice_roll_complete', { token, round: round.id, skill: round.skill, multiplier: round.multiplier });
      this.schedule(() => this.showActionScreen('auto_slide'), RESULT_HOLD_MS);
    }, round.rollDurationMs);
  }

  showActionScreen(reason = 'swipe_up') {
    if (this.state !== 'RESULT') {
      this.log('screen_switch_ignored', { state: this.state, reason });
      return;
    }
    this.el.gameRoot.classList.add('show-action');
    this.el.actionScreen.setAttribute('aria-hidden', 'false');
    this.el.diceScreen.setAttribute('aria-hidden', 'true');
    const hasMoleGameplay = Boolean(this.moleRound);
    this.el.roundCompleteButton.disabled = !hasMoleGameplay ? false : true;
    if (hasMoleGameplay) {
      this.el.roundCompleteButton.disabled = true;
      const token = this.flowToken;
      this.schedule(() => {
        if (this.isCurrent(token, 'ACTION')) this.moleRound.start(this.currentRound);
      }, SCREEN_SLIDE_MS);
    }
    this.setState('ACTION', reason);
    this.log('screen_switch', { direction: 'up', round: this.currentRound.id });
  }

  completeRound() {
    if (this.state !== 'ACTION') {
      this.log('round_complete_ignored', { state: this.state });
      return;
    }

    const completedRound = this.currentRound;
    if (this.moleRound && !this.moleRound.isComplete) {
      this.log('round_complete_ignored', { state: this.state, reason: 'mole_round_not_complete' });
      return;
    }
    const isLastRound = this.roundIndex === DICE_ROUNDS.length - 1;
    const token = ++this.flowToken;
    this.moleRound?.stop();
    this.setState('RETURNING', isLastRound ? 'restart_after_round_3' : 'next_round');
    this.el.roundCompleteButton.disabled = true;
    this.el.gameRoot.classList.remove('show-action');
    this.el.diceScreen.setAttribute('aria-hidden', 'false');
    this.log('round_complete', { round: completedRound.id, isLastRound });

    this.schedule(() => {
      if (!this.isCurrent(token, 'RETURNING')) return;
      if (isLastRound) {
        this.el.diceScreen.setAttribute('aria-hidden', 'true');
        this.el.actionScreen.setAttribute('aria-hidden', 'true');
        this.el.finalScreen?.setAttribute('aria-hidden', 'false');
        this.el.gameRoot.classList.add('show-final');
        if (this.el.finalVideo) {
          this.el.finalVideo.currentTime = 0;
          void this.el.finalVideo.play().catch(() => {});
        }
        this.setState('FINAL', 'all_rounds_complete');
        return;
      }
      this.roundIndex += 1;
      this.prepareRound('next_round_ready');
    }, SCREEN_SLIDE_MS);
  }

  handlePointerStart(clientY) {
    this.pointerStartY = this.state === 'RESULT' ? clientY : null;
  }

  handlePointerEnd(clientY) {
    if (this.pointerStartY === null) return;
    const deltaY = clientY - this.pointerStartY;
    this.pointerStartY = null;
    if (deltaY <= -55) this.showActionScreen('manual_swipe');
  }

  updateActionScreen(round) {
    this.el.actionBannerText.textContent = round.banner;
    this.el.actionBannerResult.textContent = round.multiplier;
    this.el.actionRoundLabel.textContent = `ROUND ${round.id} • ${round.skill}`;
    this.el.actionCallout.textContent = round.actionLabel;
    this.el.actionResultType.textContent = round.actionType;
    this.el.actionResultValue.textContent = round.multiplier;
    this.el.pawFill.style.height = `${round.pawStartPercent}%`;
    this.el.moleTimerFill.style.width = '100%';
    this.el.moleTimerText.textContent = round.moleDurationSeconds
      ? `${round.moleDurationSeconds.toFixed(1)}s`
      : '10.0s';
    this.el.moleStatus.textContent = 'GET READY';
    this.el.moleHammer.className = `mole-hammer weapon-${round.weapon}`;
    this.el.roundCompleteButton.textContent = round.id === DICE_ROUNDS.length ? 'RESTART THREE ROLLS' : `COMPLETE ROUND ${round.id}`;
    this.el.actionStatus.textContent = `Round ${round.id} starts after the countdown.`;
  }

  enableRoundComplete(result = {}, delayMs = AUTO_RETURN_DELAY_MS) {
    if (this.state !== 'ACTION' || this.currentRound.id !== result.round) return;
    this.el.roundCompleteButton.disabled = true;
    this.el.actionStatus.textContent = `Round ${result.round} complete. Returning to the dice shortly.`;
    const token = this.flowToken;
    this.schedule(() => {
      if (!this.isCurrent(token, 'ACTION') || !this.moleRound?.isComplete) return;
      this.completeRound();
    }, delayMs);
    this.log('round_auto_return_scheduled', {
      round: result.round,
      delay_ms: delayMs,
      coin_count: result.coinCount ?? 0,
      end_percent: result.endPercent ?? this.currentRound.pawEndPercent,
    });
  }

  isCurrent(token, expectedState) {
    return token === this.flowToken && this.state === expectedState;
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

  setState(state, reason) {
    this.state = state;
    this.el.devState.textContent = `${state} • R${this.currentRound.id}`;
    this.el.gameRoot.dataset.state = state;
    this.log('state_change', { state, reason, round: this.currentRound.id });
  }

  log(name, payload = {}) {
    this.onLog({ t: Math.round(performance.now()), name, ...payload });
  }
}
