const { createServer } = require('./server');
const { loadConfig } = require('./config');
const logger = require('./utils/logger');

function bootstrap() {
  const config = loadConfig();
  const app = createServer(config);

  const server = app.listen(config.port, () => {
    logger.info(`LangWIKI server listening on port ${config.port}`);
  });

  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return { app, server, config };
}

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };