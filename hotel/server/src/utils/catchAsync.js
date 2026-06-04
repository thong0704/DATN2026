// Wraps async route handlers, forwarding errors to centralized handler
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
