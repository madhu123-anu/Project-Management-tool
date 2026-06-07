const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://madhurimallipudi6_db_user:anu%4087477@cluster0.so61gxy.mongodb.net/projectmanagement?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to DB');
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';
    
    // 1. Register
    console.log('1. Registering user...');
    const user = await User.create({
      name: 'Test User',
      email,
      password,
      role: 'team_member'
    });
    
    user.refreshToken = 'register_refresh';
    await user.save({ validateBeforeSave: false });
    
    // 2. Fetch and test login
    console.log('2. Simulating first login (fetching with +password +refreshToken)...');
    const fetched = await User.findOne({ email }).select('+password +refreshToken');
    console.log('Password before login save:', fetched.password);
    
    // Modify lastLogin and save (exactly what login controller does)
    fetched.refreshToken = 'login_refresh';
    fetched.lastLogin = new Date();
    console.log('Saving user during login...');
    await fetched.save({ validateBeforeSave: false });
    
    // 3. Fetch again and test if login works again
    console.log('3. Simulating second login (fetching with +password +refreshToken)...');
    const fetchedSecond = await User.findOne({ email }).select('+password +refreshToken');
    console.log('Password after login save:', fetchedSecond.password);
    
    const isMatch = await fetchedSecond.comparePassword(password);
    console.log('Password comparison matches:', isMatch);
    
    // Cleanup
    await User.deleteOne({ email });
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Failed:', err);
  });
