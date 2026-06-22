const { EventEmitter } = require('events');

const PRIORITY = { HIGH: 0, NORMAL: 1, LOW: 2 };
const QUEUE_STATE = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused' };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RateController {
  constructor(config = {}) {
    this.maxConcurrent = config.maxConcurrent ?? 2;
    this.requestsPerMinute = config.requestsPerMinute ?? 10;
    this.pauseBetweenMs = config.pauseBetweenMs ?? 3000;
    this.quietHours = config.quietHours ?? [];

    this.running = 0;
    this.timestamps = [];
    this.lastRequestAt = 0;
  }

  isInQuietHours(now = new Date()) {
    const minute = now.getHours() * 60 + now.getMinutes();

    return this.quietHours.some((range) => {
      const [start, end] = String(range).split('-');
      if (!start || !end) return false;

      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (startMin <= endMin) {
        return minute >= startMin && minute <= endMin;
      }

      return minute >= startMin || minute <= endMin;
    });
  }

  _prune(nowMs) {
    const cutoff = nowMs - 60 * 1000;
    this.timestamps = this.timestamps.filter((t) => t >= cutoff);
  }

  async acquire() {
    while (true) {
      const now = Date.now();
      this._prune(now);

      const inQuietHours = this.isInQuietHours(new Date(now));
      const concurrentOk = this.running < this.maxConcurrent;
      const rpmOk = this.timestamps.length < this.requestsPerMinute;
      const intervalOk = now - this.lastRequestAt >= this.pauseBetweenMs;

      if (!inQuietHours && concurrentOk && rpmOk && intervalOk) {
        this.running += 1;
        this.timestamps.push(now);
        this.lastRequestAt = now;
        return;
      }

      await sleep(50);
    }
  }

  release() {
    this.running = Math.max(0, this.running - 1);
  }
}

class TaskQueue extends EventEmitter {
  constructor(rateConfig = {}) {
    super();
    this.jobs = [];
    this.runningJobs = new Map();
    this.completedJobs = [];
    this.state = QUEUE_STATE.IDLE;
    this.rateController = new RateController(rateConfig);
    this.nextId = 1;
  }

  _normalizeJob(job) {
    return {
      id: job.id || `job_${this.nextId++}`,
      type: job.type || 'anonymous',
      payload: job.payload || {},
      priority: Number.isInteger(job.priority) ? job.priority : PRIORITY.NORMAL,
      createdAt: job.createdAt || Date.now()
    };
  }

  _sortJobs() {
    this.jobs.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
  }

  enqueue(job) {
    const normalized = this._normalizeJob(job);
    this.jobs.push(normalized);
    this._sortJobs();

    if (this.state === QUEUE_STATE.IDLE) {
      this.state = QUEUE_STATE.RUNNING;
      this._drain();
    }

    return normalized.id;
  }

  enqueueBatch(jobs = [], priority = PRIORITY.LOW) {
    const ids = jobs.map((job) => this.enqueue({ ...job, priority }));
    return ids;
  }

  pause() {
    if (this.state !== QUEUE_STATE.PAUSED) {
      this.state = QUEUE_STATE.PAUSED;
    }
  }

  resume() {
    if (this.state === QUEUE_STATE.PAUSED) {
      this.state = QUEUE_STATE.RUNNING;
      this._drain();
    }
  }

  clear() {
    this.jobs = [];
  }

  async _executeViaListeners(job) {
    const listeners = this.listeners('execute');
    for (const handler of listeners) {
      await handler(job);
    }
  }

  _drain() {
    if (this.state !== QUEUE_STATE.RUNNING) return;

    while (
      this.state === QUEUE_STATE.RUNNING
      && this.jobs.length > 0
      && this.runningJobs.size < this.rateController.maxConcurrent
    ) {
      const job = this.jobs.shift();
      this._runJob(job);
    }

    if (this.state === QUEUE_STATE.RUNNING && this.jobs.length === 0 && this.runningJobs.size === 0) {
      this.state = QUEUE_STATE.IDLE;
    }
  }

  async _runJob(job) {
    this.runningJobs.set(job.id, { ...job, startedAt: Date.now() });

    try {
      await this.rateController.acquire();
      await this._executeViaListeners(job);

      this.completedJobs.push({
        ...job,
        status: 'completed',
        completedAt: Date.now()
      });
    } catch (error) {
      this.completedJobs.push({
        ...job,
        status: 'failed',
        error: error.message,
        completedAt: Date.now()
      });
      this.emit('jobError', { job, error });
    } finally {
      this.rateController.release();
      this.runningJobs.delete(job.id);
      this._drain();
    }
  }

  getStatus() {
    return {
      state: this.state,
      pending: this.jobs.length,
      running: this.runningJobs.size,
      completed: this.completedJobs.length
    };
  }
}

module.exports = {
  PRIORITY,
  QUEUE_STATE,
  RateController,
  TaskQueue
};