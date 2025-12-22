/**
 * Tracks user idle state for triggering hints
 */
export class IdleTracker {
  constructor(idleThreshold = 5000) {
    this.idleThreshold = idleThreshold;
    this.lastActivityTime = Date.now();
    this.isIdle = false;
    this.isRunning = false;
    this.animationId = null;

    this.idleCallbacks = [];
    this.activityCallbacks = [];
  }

  /**
   * Record user activity - resets idle timer
   */
  recordActivity() {
    this.lastActivityTime = Date.now();

    if (this.isIdle) {
      this.isIdle = false;
      this.activityCallbacks.forEach(cb => cb());
    }
  }

  /**
   * Start tracking idle state
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastActivityTime = Date.now();
    this.isIdle = false;

    const check = () => {
      if (!this.isRunning) return;

      const elapsed = Date.now() - this.lastActivityTime;

      if (!this.isIdle && elapsed >= this.idleThreshold) {
        this.isIdle = true;
        this.idleCallbacks.forEach(cb => cb(elapsed));
      }

      this.animationId = requestAnimationFrame(check);
    };

    check();
  }

  /**
   * Stop tracking
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Reset idle state
   */
  reset() {
    this.lastActivityTime = Date.now();
    this.isIdle = false;
  }

  /**
   * Get time since last activity (only meaningful when idle)
   */
  getIdleTime() {
    return this.isIdle ? Date.now() - this.lastActivityTime : 0;
  }

  /**
   * Register callback for when user becomes idle
   */
  onIdle(callback) {
    this.idleCallbacks.push(callback);
  }

  /**
   * Register callback for when user becomes active again
   */
  onActivity(callback) {
    this.activityCallbacks.push(callback);
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks() {
    this.idleCallbacks = [];
    this.activityCallbacks = [];
  }
}
