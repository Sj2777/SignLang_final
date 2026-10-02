import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.handspeak_session;
  if (!token) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Please sign in to continue.');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload.sub !== 'string') {
      return sendError(res, 401, 'INVALID_SESSION', 'Your session is invalid. Please sign in again.');
    }

    const user = await User.findById(payload.sub).select('_id accountType email profile createdAt');
    if (!user) {
      return sendError(res, 401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
    }
    if (!['individual', 'organization'].includes(user.accountType) || !user.profile) {
      return sendError(
        res,
        401,
        'ACCOUNT_MIGRATION_REQUIRED',
        'This account needs to be updated before it can be used. Please contact support.',
      );
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
    }
    return next(error);
  }
}

export function requireAccountType(accountType) {
  if (!['individual', 'organization'].includes(accountType)) {
    throw new TypeError('requireAccountType expects "individual" or "organization".');
  }

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    }
    if (req.user.accountType !== accountType) {
      return sendError(
        res,
        403,
        'ACCOUNT_TYPE_REQUIRED',
        `This route is only available to ${accountType} accounts.`,
      );
    }
    return next();
  };
}
