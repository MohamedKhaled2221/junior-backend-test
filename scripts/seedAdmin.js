
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/seedAdmin.js <username> <password>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ username });
    if (existing) {
      console.log(`User "${username}" already exists (role: ${existing.role}).`);
      process.exit(0);
    }

    const admin = await User.create({ username, password, role: 'admin' });
    console.log(`Admin user created: ${admin.username} (id: ${admin._id})`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
    process.exit(1);
  }
})();
