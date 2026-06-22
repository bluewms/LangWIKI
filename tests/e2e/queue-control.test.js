const { TaskQueue, PRIORITY } = require('../../src/queue');

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

describe('e2e/queue-control', () => {
  test('should support pause/resume and priority ordering in real execution', async () => {
    const queue = new TaskQueue({ maxConcurrent: 1, requestsPerMinute: 100, pauseBetweenMs: 0 });
    const executed = [];

    queue.on('execute', async (job) => {
      executed.push(job.payload.name);
      await sleep(5);
    });

    queue.pause();
    queue.enqueue({ payload: { name: 'low' }, priority: PRIORITY.LOW });
    queue.enqueue({ payload: { name: 'high' }, priority: PRIORITY.HIGH });
    queue.enqueue({ payload: { name: 'normal' }, priority: PRIORITY.NORMAL });

    await sleep(30);
    expect(executed).toEqual([]);

    queue.resume();
    await waitFor(() => queue.getStatus().completed === 3);

    expect(executed).toEqual(['high', 'normal', 'low']);
  });
});
