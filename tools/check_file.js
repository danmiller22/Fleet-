const fs = require('fs');
const vm = require('vm');

const file = process.argv[2];
if(!file){ console.error('Usage: node tools/check_file.js <file.js>'); process.exit(2); }
try {
  const code = fs.readFileSync(file, 'utf8');
  new vm.Script(code, { filename: file });
  console.log(file+': Syntax OK');
} catch (e) {
  console.error('Syntax error in '+file+':\n', e.stack || String(e));
  process.exit(1);
}

