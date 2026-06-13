/**
 * Seed an admin user from environment variables.
 * Run: npm run seed:admin
 *
 * Required env vars:
 *   ADMIN_EMAIL      — admin's email
 *   ADMIN_PASSWORD   — plaintext password (will be hashed by the User model)
 *   ADMIN_NAME       — display name (optional, defaults to "Administrator")
 *
 * Behavior:
 *   - If a user with ADMIN_EMAIL exists, promotes them to admin and resets password.
 *   - Otherwise creates a new admin user.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.model';

dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const env = (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development';
  const uriMap = {
    development: process.env.MONGO_URI_DEVELOPMENT,
    staging: process.env.MONGO_URI_STAGING,
    production: process.env.MONGO_URI_PRODUCTION,
  };
  const uri = uriMap[env] || process.env.MONGO_URI;

  if (!uri) {
    console.error(`❌ No MongoDB URI configured for NODE_ENV="${env}"`);
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✓ Connected to MongoDB [${env}]`);

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.name = name;
    existing.role = 'admin';
    existing.password = password; // pre-save hook will hash it
    existing.isEmailVerified = true;
    await existing.save();
    console.log(`✓ Updated existing user → admin: ${email}`);
  } else {
    await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isEmailVerified: true,
    });
    console.log(`✓ Created admin: ${email}`);
  }

  await mongoose.disconnect();
  console.log('✓ Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
