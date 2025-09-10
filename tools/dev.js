const { spawn } = require('child_process');

function run(name, cmd, args, opts={}){
  const p = spawn(cmd, args, { stdio: ['ignore','pipe','pipe'], shell: false, ...opts });
  const tag = `[${name}]`;
  p.stdout.on('data', d => process.stdout.write(`${tag} ${d}`));
  p.stderr.on('data', d => process.stderr.write(`${tag} ${d}`));
  p.on('exit', code => console.log(`${tag} exited with code ${code}`));
  return p;
}

console.log('Starting dev servers...');
const api = run('api', 'node', ['server/api-server.js'], { env: { ...process.env, API_PORT: process.env.API_PORT || '3000' } });
const web = run('web', 'node', ['tools/dev-server.js'], { env: { ...process.env, PORT: process.env.PORT || '5173' } });

function shutdown(){
  console.log('\nShutting down...');
  api.kill('SIGINT');
  web.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

