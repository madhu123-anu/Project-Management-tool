const dns = require('dns');

console.log('Setting DNS servers to 8.8.8.8...');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolveSrv('_mongodb._tcp.cluster0.so61gxy.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('dns.resolveSrv failed:', err);
  } else {
    console.log('dns.resolveSrv success:', addresses);
  }
});
