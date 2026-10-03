const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.get('x-api-key');
  if (!token) return res.status(401).json({ error: 'Authentication token required in x-api-key header' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.sub) return res.status(401).json({ error: 'Invalid authentication token' });
    req.user = { id: String(payload.sub) };
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

module.exports = requireAuth;
