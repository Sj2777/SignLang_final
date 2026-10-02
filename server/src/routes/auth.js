import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const organizationTypes = ['school', 'NGO', 'company', 'interpreter agency', 'other'];
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many sign-in attempts. Please wait a little and try again.',
      },
    });
  },
});

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details?.length) error.details = details;
  return res.status(status).json({ error });
}

function createSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, accountType: user.accountType },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
  res.cookie('handspeak_session', token, sessionCookieOptions());
}

function publicUser(user) {
  const name = user.accountType === 'individual'
    ? user.profile.fullName
    : user.profile.organizationName;

  return {
    id: user.id,
    accountType: user.accountType,
    email: user.email,
    profile: user.profile,
    name,
    createdAt: user.createdAt,
  };
}

function reportValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return sendError(
    res,
    400,
    'VALIDATION_ERROR',
    'Please correct the highlighted fields.',
    result.array().map(({ path, msg }) => ({ field: path, message: msg })),
  );
}

const commonValidators = [
  body('email')
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .bail()
    .isLength({ max: 254 }).withMessage('Email address must be 254 characters or fewer.')
    .customSanitizer((email) => email.toLowerCase()),
  body('password')
    .isString().withMessage('Password is required.')
    .bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.'),
];

const individualValidators = [
  ...commonValidators,
  body('profile.fullName')
    .isString().withMessage('Full name is required.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Full name must be between 1 and 100 characters.'),
];

const organizationValidators = [
  ...commonValidators,
  body('profile.organizationName')
    .isString().withMessage('Organization name is required.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage('Organization name must be between 1 and 120 characters.'),
  body('profile.organizationType')
    .isIn(organizationTypes).withMessage(`Organization type must be one of: ${organizationTypes.join(', ')}.`),
  body('profile.contactPersonName')
    .isString().withMessage('Contact person name is required.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Contact person name must be between 1 and 100 characters.'),
  body('profile.contactPhone')
    .optional({ values: 'falsy' })
    .isString().withMessage('Contact phone must be text.')
    .bail()
    .trim()
    .matches(/^[+()\d .-]{7,30}$/).withMessage('Enter a valid contact phone number.'),
  body('profile.website')
    .optional({ values: 'falsy' })
    .isString().withMessage('Website must be a URL.')
    .bail()
    .trim()
    .isLength({ max: 2048 }).withMessage('Website must be 2048 characters or fewer.')
    .bail()
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Website must be a valid URL starting with http:// or https://.'),
];

function registrationHandler(accountType) {
  return async (req, res, next) => {
    try {
      const { email, password, profile } = req.body;
      const existingUser = await User.exists({ email });
      if (existingUser) {
        return sendError(res, 409, 'EMAIL_IN_USE', 'An account with that email already exists.');
      }

      const user = await User.create({
        accountType,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        profile,
      });
      createSession(res, user);
      return res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      if (error.code === 11000) {
        return sendError(res, 409, 'EMAIL_IN_USE', 'An account with that email already exists.');
      }
      return next(error);
    }
  };
}

function loginHandler(accountType) {
  return async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      if (!['individual', 'organization'].includes(user.accountType)) {
        return sendError(
          res,
          409,
          'ACCOUNT_MIGRATION_REQUIRED',
          'This account was created before account types were supported. Please contact support to update it.',
        );
      }
      if (user.accountType !== accountType) {
        return sendError(
          res,
          403,
          'ACCOUNT_TYPE_MISMATCH',
          `This account is registered as an ${user.accountType} account. Use the ${user.accountType} sign-in endpoint.`,
        );
      }

      createSession(res, user);
      return res.json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  };
}

router.post(
  '/register/individual',
  individualValidators,
  reportValidationErrors,
  registrationHandler('individual'),
);

router.post(
  '/register/organization',
  organizationValidators,
  reportValidationErrors,
  registrationHandler('organization'),
);

router.post(
  '/login/individual',
  authLimiter,
  commonValidators,
  reportValidationErrors,
  loginHandler('individual'),
);

router.post(
  '/login/organization',
  authLimiter,
  commonValidators,
  reportValidationErrors,
  loginHandler('organization'),
);

router.post('/logout', (req, res) => {
  const { maxAge, ...clearCookieOptions } = sessionCookieOptions();
  res.clearCookie('handspeak_session', clearCookieOptions);
  return res.json({ message: 'You have signed out.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
