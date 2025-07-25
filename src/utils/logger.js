const winston = require('winston');

// Definir niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir nivel de log basado en el entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Definir colores para cada nivel de log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Agregar colores a winston
winston.addColors(colors);

// Definir el formato para los logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir transportes para los logs
const transports = [
  // Transporte de consola para todos los logs
  new winston.transports.Console(),
  
  // Transporte de archivo para logs de error
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // Transporte de archivo para todos los logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || level(),
  levels,
  format,
  transports,
});

module.exports = logger;