// Friendly guard: the server uses Node's built-in SQLite (no native build tools needed).
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 13)) {
  console.error('\n  CortexPLM needs Node.js 22.13 or newer (you have ' + process.versions.node + ').');
  console.error('  Download the LTS version from https://nodejs.org and run "npm install" again.\n');
  process.exit(1);
}
