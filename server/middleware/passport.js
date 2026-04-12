const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getDB, seedDefaultCategories } = require('../db/database');

module.exports = function (passport) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const db = getDB();
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value;
        const googleId = profile.id;

        // Check existing user by google_id or email
        let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

        if (user) {
          // Update google_id if linked for first time
          if (!user.google_id) {
            db.prepare('UPDATE users SET google_id = ?, avatar_url = ?, email_verified = 1 WHERE id = ?')
              .run(googleId, avatarUrl, user.id);
          }
          return done(null, user);
        }

        // Create new user
        const result = db.prepare(
          'INSERT INTO users (name, email, google_id, avatar_url, email_verified) VALUES (?, ?, ?, ?, 1)'
        ).run(name, email, googleId, avatarUrl);

        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        seedDefaultCategories(newUser.id);
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
};
