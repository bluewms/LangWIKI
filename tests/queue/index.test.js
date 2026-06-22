const { TaskQueue, PRIORITY, QUEUE_STATE, RateController } = require('../../src/queue');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(condition, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (condition()) return;
    await sleep(10);
  }
  throw new Error('waitFor timeout');
}

describe('queue/index', () => {
  test('RateController should detect quiet hours', () => {
    const controller = new RateController({ quietHours: ['09:00-12:00'] });

    const inQuiet = new Date('2026-05-29T10:30:00');
    const outQuiet = new Date('2026-05-29T13:30:00');

    expect(controller.isInQuietHours(inQuiet)).toBe(true);
    expect(controller.isInQuietHours(outQuiet)).toBe(false);
  });

  test('TaskQueue should execute higher priority jobs first when resumed', async () => {
    const queue = new TaskQueue({ maxConcurrent: 1, requestsPerMinute: 100, pauseBetweenMs: 0 });
    const executed = [];

    queue.on('execute', async (job) => {
      executed.push(job.payload.name);
      await sleep(5);
    });

    queue.pause();
    queue.enqueue({ payload: { name: 'low' }, priority: PRIORITY.LOW });
    queue.enqueue({ payload: { name: 'normal' }, priority: PRIORITY.NORMAL });
    queue.enqueue({ payload: { name: 'high' }, priority: PRIORITY.HIGH });

    queue.resume();

    await waitFor(() => queue.getStatus().completed === 3);

    expect(executed).toEqual(['high', 'normal', 'low']);
    expect(queue.state).toBe(QUEUE_STATE.IDLE);
  });

  test('TaskQueue pause/resume should control execution', async () => {
    const queue = new TaskQueue({ maxConcurrent: 1, requestsPerMinute: 100, pauseBetweenMs: 0 });
    const executed = [];

    queue.on('execute', async (job) => {
      executed.push(job.payload.id);
    });

    queue.pause();
    queue.enqueue({ payload: { id: 1 }, priority: PRIORITY.NORMAL });

    await sleep(50);
    expect(executed).toEqual([]);
    expect(queue.state).toBe(QUEUE_STATE.PAUSED);

    queue.resume();
    await waitFor(() => executed.length === 1);

    expect(executed).toEqual([1]);
  });
});
