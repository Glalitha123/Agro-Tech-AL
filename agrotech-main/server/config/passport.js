import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export function setupPassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn('[PASSPORT WARNING] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
          const googleId = profile.id;
          const displayName = profile.displayName || 'Google Farmer User';

          // 1. Check if user exists by googleId
          let user = await User.findOne({ googleId });

          if (!user && email) {
            // 2. Check if user exists by email
            user = await User.findOne({ email });
            if (user) {
              // Link googleId to existing user account
              user.googleId = googleId;
              await user.save();
            }
          }

          if (!user) {
            // 3. Create new user for Google login
            user = await User.create({
              name: displayName,
              email: email || `${googleId}@google.com`,
              googleId,
              role: 'farmer',
              profile: {
                state: '',
                landSize: 0,
                category: '',
                primaryCrops: []
              }
            });
            console.log(`[GOOGLE AUTH] Created new user: ${user.email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error('[GOOGLE AUTH ERROR]', error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}
