let app;
try {
  app = require('../server/index');
} catch (initErr) {
  console.error('[...express] init error:', initErr);
  app = (req, res) => res.status(500).json({ error: 'Server init failed', detail: initErr.message });
}

module.exports = (req, res) => {
  console.log('[...express] req.url =', req.url, 'method =', req.method);
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  console.log('[...express] rewritten url =', req.url);
  return app(req, res);
};
