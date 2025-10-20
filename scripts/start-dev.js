const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Bhoomi Setu Development Environment...\n');

// Function to run a command in a specific directory
function runCommand(command, args, cwd, name, color) {
  const process = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    console.log(`\x1b[${color}m[${name}]\x1b[0m ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`\x1b[${color}m[${name}]\x1b[0m ${data.toString().trim()}`);
  });

  process.on('close', (code) => {
    console.log(`\x1b[${color}m[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return process;
}

// Start all services
console.log('Starting services...\n');

// Start Hardhat local blockchain
const hardhat = runCommand('npm', ['run', 'dev'], 'contracts', 'HARDHAT', '36'); // Cyan

// Wait a bit for Hardhat to start, then deploy contracts
setTimeout(() => {
  console.log('\n📦 Deploying smart contracts...\n');
  runCommand('npm', ['run', 'deploy:local'], 'contracts', 'DEPLOY', '33'); // Yellow
}, 5000);

// Start backend server
setTimeout(() => {
  const backend = runCommand('npm', ['run', 'dev'], 'backend', 'BACKEND', '32'); // Green
}, 2000);

// Start frontend server
setTimeout(() => {
  const frontend = runCommand('npm', ['run', 'dev'], 'frontend', 'FRONTEND', '34'); // Blue
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  process.exit(0);
});

console.log(`
🌟 Bhoomi Setu Development Environment Starting...

Services will be available at:
📱 Frontend: http://localhost:3000
🔧 Backend API: http://localhost:3002
⛓️  Hardhat Network: http://localhost:8545

Press Ctrl+C to stop all services.
`);