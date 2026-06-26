import winston from 'winston';
import moment from 'moment';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

// Add Discord logging capability
let logChannel = null;

export const setLogChannel = (channel) => {
  logChannel = channel;
};

export const sendLogToDiscord = async (level, message, content = null) => {
  if (!logChannel) return;
  
  try {
    const embed = {
      color: level === 'error' ? 0xED4245 : level === 'warn' ? 0xFEE75C : 0x5865F2,
      title: `📋 ${level.toUpperCase()}`,
      description: message,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Bot Logs',
      },
    };

    if (content) {
      embed.fields = [
        {
          name: 'Additional Info',
          value: typeof content === 'object' ? JSON.stringify(content, null, 2) : content,
          inline: false,
        },
      ];
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    logger.error('Failed to send log to Discord:', error);
  }
};

// Override log methods to also send to Discord
const originalLog = logger.log.bind(logger);
logger.log = function(level, message, ...args) {
  originalLog(level, message, ...args);
  if (level === 'error' || level === 'warn') {
    sendLogToDiscord(level, message, args[0]);
  }
};

export { logger };
