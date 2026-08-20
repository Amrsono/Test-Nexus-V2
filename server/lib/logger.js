const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message, ...meta }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message, ...meta }));
  },
  error: (message, error = null, meta = {}) => {
    const errorDetails = error ? { errorName: error.name, errorMessage: error.message, errorStack: error.stack } : {};
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      ...errorDetails,
      ...meta
    }));
  }
};

module.exports = logger;
