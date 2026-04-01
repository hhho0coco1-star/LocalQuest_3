const fs = require('fs');
const path = require('path');
const https = require('https');
const httpProxy = require('http-proxy');
const HTTPS_PORT = Number(process.env.HTTPS_BACKEND_PORT || 8443);
const TARGET = process.env.HTTPS_BACKEND_TARGET || 'http://127.0.0.1:8080';
const CERT_DIR = path.join(__dirname, '..', '.cert');
const PFX_PATH = path.join(CERT_DIR, 'backend-local.pfx');
const PFX_PASSPHRASE = process.env.HTTPS_BACKEND_CERT_PASSPHRASE || 'localquest-dev';

const ensureCertificate = () => {
  if (!fs.existsSync(PFX_PATH)) {
    throw new Error(
      [
        `Missing HTTPS certificate: ${PFX_PATH}`,
        'Generate it with the bundled PowerShell command or script before starting the proxy.',
      ].join('\n')
    );
  }

  return {
    pfx: fs.readFileSync(PFX_PATH),
    passphrase: PFX_PASSPHRASE,
  };
};

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true,
  secure: false,
  ws: true,
});

proxy.on('error', (error, req, res) => {
  const message = `HTTPS backend proxy error: ${error.message}`;
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  if (res) {
    res.end(message);
  } else {
    console.error(message);
  }
});

const credentials = ensureCertificate();
const server = https.createServer(credentials, (req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`HTTPS backend proxy listening on https://0.0.0.0:${HTTPS_PORT}`);
  console.log(`Proxy target: ${TARGET}`);
  console.log(`Certificate file: ${PFX_PATH}`);
});
