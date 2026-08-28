require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User } = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;

async function createSuperAdmin() {
  if (!MONGO_URI) throw new Error('MONGO_URI is required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SUPER_ADMIN_EMAIL must be a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) {
    throw new Error('SUPER_ADMIN_PASSWORD must be between 12 and 1024 characters.');
  }

  await mongoose.connect(MONGO_URI);
  const existingSuperAdmin = await User.exists({ role: 'super_admin' });
  if (existingSuperAdmin) {
    throw new Error('A super_admin already exists. Refusing to create another account.');
  }
  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new Error('A user with this email already exists.');
  }

  await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'super_admin',
    isActive: true,
  });

  console.log('Initial super_admin created successfully.');
}

createSuperAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
