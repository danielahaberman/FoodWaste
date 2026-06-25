import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? 'dev-jwt-secret-change-in-production' : null);

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required in production');
}

export const AUTH_NOT_CONFIGURED_MESSAGE =
  'Server authentication is not configured. Set JWT_SECRET in the server environment.';

export function isJwtConfigured() {
  return !!JWT_SECRET;
}

export const TOKEN_EXPIRY = '7d';
export const ADMIN_TOKEN_EXPIRY = '8h';

export function signUserToken(userId, username) {
  if (!JWT_SECRET) {
    throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
  }
  return jwt.sign({ user_id: userId, username, role: 'user' }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function signAdminToken(username) {
  if (!JWT_SECRET) {
    throw new Error(AUTH_NOT_CONFIGURED_MESSAGE);
  }
  return jwt.sign({ role: 'admin', username }, JWT_SECRET, {
    expiresIn: ADMIN_TOKEN_EXPIRY,
  });
}

export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(503).json({ error: AUTH_NOT_CONFIGURED_MESSAGE });
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role === 'admin') {
      return res.status(403).json({ error: 'Invalid token for this endpoint' });
    }

    req.user_id = payload.user_id;
    req.username = payload.username;

    const clientUserId =
      req.body?.user_id ??
      req.body?.userId ??
      req.query?.user_id ??
      req.query?.userId;

    if (clientUserId != null && String(clientUserId) !== String(payload.user_id)) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(503).json({ error: AUTH_NOT_CONFIGURED_MESSAGE });
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

export function requireSelfUserId(req, res, next) {
  const paramUserId = req.params.userId;
  if (paramUserId && String(paramUserId) !== String(req.user_id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

export function getAdminCredentials() {
  return {
    username: 'admin',
    password: 'Admin_Food_Waste',
  };
}
