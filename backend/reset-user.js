const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const email = 'madhurimallipudi6@gmail.com';
    const newPassword = 'password123';

    // Hash the password exactly once
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the database directly to bypass mongoose save hooks
    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log(`SUCCESS: Reset password for ${email} to "password123"`);
    } else {
      console.log(`FAILED: No user found with email ${email}`);
    }
  } catch (err) {
    console.error('Error during reset:', err);
  } finally {
    await mongoose.disconnect();
  }
}

reset();
