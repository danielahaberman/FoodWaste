import { networkInterfaces } from 'os';

const nets = networkInterfaces();
const results = {};

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

console.log('\n📱 Your local IP addresses:');
console.log('='.repeat(50));
for (const name of Object.keys(results)) {
  console.log(`\n${name}:`);
  results[name].forEach(ip => {
    console.log(`  • http://${ip}:5173 (Frontend)`);
    console.log(`  • http://${ip}:5001 (Backend)`);
  });
}
console.log('\n' + '='.repeat(50));
console.log('\n💡 Connect your phone to the same Wi-Fi network and use one of the IPs above.\n');

