
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔐 Generating REAL working SSL certificates for localhost...\n');

// Check if certificates directory exists
if (!fs.existsSync('certs')) {
  fs.mkdirSync('certs');
  console.log('📁 Created certs directory');
}

// Method 1: Using OpenSSL (most reliable)
function generateWithOpenSSL() {
  try {
    console.log('🔧 Using OpenSSL to generate certificates...');
    
    // Create OpenSSL config file
    const opensslConfig = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN=localhost
C=US
ST=State
L=City
O=MCP Server
OU=Development

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
`;

    fs.writeFileSync('certs/openssl.conf', opensslConfig);
    
    // Generate private key and certificate
    execSync('openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt -config certs/openssl.conf -extensions v3_req', { stdio: 'inherit' });
    
    // Clean up config file
    fs.unlinkSync('certs/openssl.conf');
    
    console.log('✅ SSL certificates generated successfully with OpenSSL!');
    return true;
    
  } catch (error) {
    console.log('❌ OpenSSL method failed:', error.message);
    return false;
  }
}