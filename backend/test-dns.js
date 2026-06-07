const dns = require('dns');
const mongoose = require('mongoose');

console.log('Testing default dns order...');
mongoose.connect('mongodb+srv://madhurimallipudi6_db_user:anu%4087477@cluster0.so61gxy.mongodb.net/projectmanagement?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Default connected!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Default failed:', err.message);
    
    console.log('Retrying with ipv4first...');
    dns.setDefaultResultOrder('ipv4first');
    
    mongoose.connect('mongodb+srv://madhurimallipudi6_db_user:anu%4087477@cluster0.so61gxy.mongodb.net/projectmanagement?retryWrites=true&w=majority&appName=Cluster0')
      .then(() => {
        console.log('ipv4first connected!');
        process.exit(0);
      })
      .catch(err2 => {
        console.error('ipv4first failed:', err2.message);
        process.exit(1);
      });
  });
