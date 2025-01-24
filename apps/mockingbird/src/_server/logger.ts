import { env } from '@/../env';
import { join } from 'path';
import winston from 'winston';

const { combine, errors, json, timestamp } = winston.format;

const createLogFileName = () => {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0];
  return `mockingbird-${env.NODE_ENV ?? env.VERCEL_ENV}-${dateString}.log`;
};

const options: winston.LoggerOptions = {
  level: env.LOG_LEVEL,
  format: combine(timestamp(), json(), errors({ stack: true })),
  transports: [
    new winston.transports.Console(),
    ...(process.env.VERCEL !== '1'
      ? [
          new winston.transports.File({
            filename: join(env.LOG_DIR ?? '', createLogFileName()),
          }),
        ]
      : []),
  ],
};

const baseLogger = winston.createLogger(options);

export default baseLogger;
