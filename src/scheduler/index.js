/**
 * 原生定时调度器
 *
 * 使用 node-cron 在进程内管理定时扫描任务，无需外部依赖。
 */

const cron = require('node-cron');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.jobs = new Map(); // jobId → { task, cronExpression, callback, workspaceId }
    this.counter = 0;
  }

  /**
   * 注册定时扫描任务
   * @param {string} workspaceId - 工作区标识
   * @param {string} cronExpression - cron 表达式 (如 "0 * * * *" 每小时)
   * @param {Function} callback - 触发时执行的异步函数
   * @returns {string} jobId
   */
  registerScanJob(workspaceId, cronExpression, callback) {
    if (!cron.validate(cronExpression)) {
      throw new Error(`无效的 cron 表达式: ${cronExpression}`);
    }

    const jobId = `langwiki-scan-${workspaceId}-${++this.counter}`;

    // 如果已存在同 workspace 的任务，先移除
    for (const [id, job] of this.jobs) {
      if (job.workspaceId === workspaceId) {
        job.task.stop();
        this.jobs.delete(id);
      }
    }

    const task = cron.schedule(cronExpression, async () => {
      logger.info(`[Scheduler] 触发任务 ${jobId} (workspace: ${workspaceId})`);
      try {
        await callback(workspaceId);
      } catch (err) {
        logger.error(`[Scheduler] 任务 ${jobId} 执行失败: ${err.message}`);
      }
    });

    this.jobs.set(jobId, {
      task,
      cronExpression,
      callback,
      workspaceId,
      createdAt: new Date().toISOString()
    });

    logger.info(`[Scheduler] 已注册任务 ${jobId}, cron: ${cronExpression}`);
    return jobId;
  }

  /**
   * 列出所有任务
   */
  listJobs() {
    return Array.from(this.jobs.entries()).map(([id, job]) => ({
      id,
      workspaceId: job.workspaceId,
      cronExpression: job.cronExpression,
      createdAt: job.createdAt
    }));
  }

  /**
   * 移除任务
   */
  removeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.task.stop();
    this.jobs.delete(jobId);
    logger.info(`[Scheduler] 已移除任务 ${jobId}`);
    return true;
  }

  /**
   * 停止所有任务
   */
  stopAll() {
    for (const job of this.jobs.values()) {
      job.task.stop();
    }
    this.jobs.clear();
    logger.info('[Scheduler] 已停止所有任务');
  }
}

module.exports = {
  Scheduler
};
