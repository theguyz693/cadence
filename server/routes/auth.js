import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cadence_jwt_secret_2026_xK9mPqR7sT';

function generateToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** The user fields the client sees. */
function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    ...(user.email ? { email: user.email } : {}),
    ...(user.name ? { name: user.name } : {}),
    ...(user.picture ? { picture: user.picture } : {}),
    provider: user.googleId ? 'google' : 'password',
  };
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/** A unique, valid username derived from an email address ("alex.r@x.com" → "alex.r", "alex.r2", …). */
async function usernameFromEmail(email) {
  const base = (email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 24)
    .padEnd(2, '0');
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `${base}${Date.now().toString(36)}`.slice(0, 30);
}

// GET /api/auth/config — public sign-in options for the client
router.get('/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

// POST /api/auth/google { credential } — sign in or sign up with a Google ID token
router.post('/google', async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ error: 'Google sign-in isn’t set up on this server.' });
  }
  const credential = req.body?.credential;
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Missing Google credential.' });
  }

  let payload;
  try {
    // Verifies Google's signature, expiry, issuer and that the token was issued for this app.
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch (err) {
    console.warn('Google token rejected:', err.message);
    return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ error: 'Your Google account needs a verified email address.' });
  }

  try {
    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      // Link to an existing account with the same verified email, if there is one.
      user = await User.findOne({ email });
      if (user) {
        user.googleId = payload.sub;
      } else {
        user = new User({ username: await usernameFromEmail(email), email, googleId: payload.sub });
      }
    }
    user.name = payload.name || user.name;
    user.picture = payload.picture || user.picture;
    if (!user.email) user.email = email;
    const isNew = user.isNew;
    await user.save();

    res.status(isNew ? 201 : 200).json({ token: generateToken(user), user: publicUser(user), isNew });
  } catch (err) {
    console.error('Google sign-in error:', err);
    res.status(500).json({ error: 'Failed to sign in with Google.' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const user = new User({ username: username.trim(), password });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Use “Continue with Google”.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Client handles token removal
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(publicUser(user));
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user.' });
  }
});

export default router;
