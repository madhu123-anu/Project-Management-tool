const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const email = 'madhurimallipudi6@gmail.com';
    const result = await User.deleteOne({ email: email.toLowerCase() });

    if (result.deletedCount > 0) {
      console.log(`SUCCESS: Deleted old user ${email}`);
    } else {
      console.log(`FAILED: No user found with email ${email}`);
    }
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deleteUser();
