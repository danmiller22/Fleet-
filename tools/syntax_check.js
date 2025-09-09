const fs = require('fs');
const vm = require('vm');

try {
  const code = fs.readFileSync('js/app.js', 'utf8');
  new vm.Script(code, { filename: 'js/app.js' });
  console.log('js/app.js: Syntax OK');
  process.exit(0);
} catch (e) {
  console.error('Syntax error in js/app.js:\n', e.stack || String(e));
  process.exit(1);
}

