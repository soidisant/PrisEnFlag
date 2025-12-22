export class Timer {
  constructor(duration = 30000) {
    this.duration = duration;
    this.startTime = null;
    this.elapsed = 0;
    this.animationId = null;
    this.onTick = null;
    this.onComplete = null;
  }

  start() {
    this.startTime = Date.now();
    this.elapsed = 0;
    this.tick();
  }

  tick() {
    if (!this.startTime) return;

    this.elapsed = Date.now() - this.startTime;

    if (this.onTick) {
      const remaining = Math.max(0, this.duration - this.elapsed);
      this.onTick(remaining, this.elapsed);
    }

    if (this.elapsed >= this.duration) {
      this.stop();
      if (this.onComplete) {
        this.onComplete();
      }
    } else {
      this.animationId = requestAnimationFrame(() => this.tick());
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.stop();
    this.startTime = null;
    this.elapsed = 0;
  }

  getElapsed() {
    return this.elapsed;
  }

  getProgress() {
    return Math.min(1, this.elapsed / this.duration);
  }
}
