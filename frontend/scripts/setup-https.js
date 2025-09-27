const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create certificates directory
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate self-signed certificate for localhost
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed certificate for localhost...');
  
  try {
    execSync(`openssl req -x509 -out ${certPath} -keyout ${keyPath} -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -extensions EXT -config <(printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")`, { stdio: 'inherit' });
    console.log('Certificate generated successfully!');
  } catch (error) {
    console.error('Error generating certificate:', error.message);
    console.log('\nPlease install OpenSSL or run the following command manually:');
    console.log(`openssl req -x509 -out ${certPath} -keyout ${keyPath} -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost'`);
  }
} else {
  console.log('Certificate already exists.');
}
