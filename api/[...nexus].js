const app = require('../server/index');

module.exports = (req, res) => {
  // Vercel Serverless Functions strip the `/api` prefix from req.url.
  // Our Express app expects routes to start with `/api`.
  // We prepend it here so Express routing works exactly like local development.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
};
