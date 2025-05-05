const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/speech-api',
    createProxyMiddleware({
      target: 'https://www.google.com',
      changeOrigin: true,
      secure: false
    })
  );
};