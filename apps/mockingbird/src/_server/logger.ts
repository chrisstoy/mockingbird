import winston from 'winston';
import { join } from 'path';
import { env } from 'apps/mockingbird/env.mjs';

const { combine, errors, json, timestamp } = winston.format;

const createLogFileName = () => {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0];
  return `mockingbird-${env.NODE_ENV}-${dateString}.log`;
};

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(timestamp(), json(), errors({ stack: true })),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: join(env.LOG_DIR ?? '', createLogFileName()),
    }),
  ],
});

export default logger;
