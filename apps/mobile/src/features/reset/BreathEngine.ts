import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import type { BreathPhaseSpec } from './types';

type EngineStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed';

type PhaseSnapshot = {
  phase: BreathPhaseSpec;
  phaseIndex: number;
  loop: number;
  phaseElapsedMs: number;
  phaseRemainingMs: number;
};

type TickPayload = PhaseSnapshot & {
  totalElapsedMs: number;
  remainingMs: number;
};

type BreathEngineCallbacks = {
  onTick?: (payload: TickPayload) => void;
  onPhaseChange?: (payload: PhaseSnapshot) => void;
  onCompleted?: () => void;
  onStopped?: () => void;
};

interface BreathEngineConfig {
  phases: BreathPhaseSpec[];
  sessionLengthMs: number;
  tickIntervalMs?: number;
}

export class BreathEngine {
  private phases: BreathPhaseSpec[];

  private sessionLengthMs: number;

  private tickIntervalMs: number;

  private callbacks: BreathEngineCallbacks;

  private status: EngineStatus = 'idle';

  private elapsedMs = 0;

  private timer: ReturnType<typeof setInterval> | null = null;

  private lastTickTimestamp = 0;

  private currentPhaseIndex = 0;

  private currentLoop = 0;

  private appStateSubscription: NativeEventSubscription | null = null;

  constructor(config: BreathEngineConfig, callbacks: BreathEngineCallbacks) {
    if (!config.phases || config.phases.length === 0) {
      throw new Error('BreathEngine requires at least one phase');
    }

    this.phases = config.phases;
    this.sessionLengthMs = Math.max(config.sessionLengthMs, 1000);
    this.tickIntervalMs = config.tickIntervalMs ?? 100;
    this.callbacks = callbacks;
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  start() {
    if (this.status === 'running') {
      return;
    }

    this.resetInternalState();
    this.status = 'running';
    this.lastTickTimestamp = Date.now();
    this.emitPhaseChange();
    this.emitTick();
    this.startTimer();
    this.attachAppStateListener();
  }

  pause() {
    if (this.status !== 'running') {
      return;
    }

    this.clearTimer();
    this.status = 'paused';
  }

  resume() {
    if (this.status !== 'paused') {
      return;
    }

    this.status = 'running';
    this.lastTickTimestamp = Date.now();
    this.startTimer();
  }

  stop() {
    if (this.status === 'stopped') {
      return;
    }

    this.clearTimer();
    this.detachAppStateListener();
    this.status = 'stopped';
    this.callbacks.onStopped?.();
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getElapsedMs(): number {
    return this.elapsedMs;
  }

  private resetInternalState() {
    this.elapsedMs = 0;
    this.currentPhaseIndex = 0;
    this.currentLoop = 0;
  }

  private startTimer() {
    this.clearTimer();
    this.timer = setInterval(() => this.handleTick(), this.tickIntervalMs);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private handleTick() {
    if (this.status !== 'running') {
      return;
    }

    const now = Date.now();
    const delta = now - this.lastTickTimestamp;
    this.lastTickTimestamp = now;
    this.elapsedMs += delta;

    if (this.elapsedMs >= this.sessionLengthMs) {
      this.elapsedMs = this.sessionLengthMs;
      this.emitTick();
      this.complete();
      return;
    }

    const snapshot = this.buildPhaseSnapshot();
    if (snapshot.phaseIndex !== this.currentPhaseIndex || snapshot.loop !== this.currentLoop) {
      this.currentPhaseIndex = snapshot.phaseIndex;
      this.currentLoop = snapshot.loop;
      this.callbacks.onPhaseChange?.(snapshot);
    }

    this.callbacks.onTick?.({ ...snapshot, totalElapsedMs: this.elapsedMs, remainingMs: this.sessionLengthMs - this.elapsedMs });
  }

  private emitPhaseChange() {
    const snapshot = this.buildPhaseSnapshot();
    this.callbacks.onPhaseChange?.(snapshot);
  }

  private emitTick() {
    const snapshot = this.buildPhaseSnapshot();
    this.callbacks.onTick?.({ ...snapshot, totalElapsedMs: this.elapsedMs, remainingMs: this.sessionLengthMs - this.elapsedMs });
  }

  private buildPhaseSnapshot(): PhaseSnapshot {
    const cycleDuration = this.getCycleDuration();
    const withinCycle = cycleDuration > 0 ? this.elapsedMs % cycleDuration : 0;
    let remainder = withinCycle;

    for (let index = 0; index < this.phases.length; index += 1) {
      const phase = this.phases[index];
      const duration = Math.max(phase.durationMs, 1);
      if (remainder < duration) {
        return {
          phase,
          phaseIndex: index,
          loop: Math.floor(this.elapsedMs / Math.max(cycleDuration, 1)),
          phaseElapsedMs: remainder,
          phaseRemainingMs: duration - remainder,
        };
      }
      remainder -= duration;
    }

    const lastPhase = this.phases[this.phases.length - 1];
    return {
      phase: lastPhase,
      phaseIndex: this.phases.length - 1,
      loop: Math.floor(this.elapsedMs / Math.max(cycleDuration, 1)),
      phaseElapsedMs: lastPhase.durationMs,
      phaseRemainingMs: 0,
    };
  }

  private getCycleDuration() {
    return this.phases.reduce((acc, phase) => acc + Math.max(phase.durationMs, 0), 0);
  }

  private complete() {
    this.clearTimer();
    this.detachAppStateListener();
    this.status = 'completed';
    this.callbacks.onCompleted?.();
  }

  private handleAppStateChange(nextState: AppStateStatus) {
    if (nextState !== 'active' && this.status === 'running') {
      this.pause();
    }
  }

  private attachAppStateListener() {
    this.detachAppStateListener();
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private detachAppStateListener() {
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }
}

export type BreathEngineSnapshot = TickPayload;
