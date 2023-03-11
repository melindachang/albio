// This script generates the TypeScript definitions

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

try {
  execSync('tsc -p src/compiler --emitDeclarationOnly && tsc -p src/runtime --emitDeclarationOnly');
} catch (err) {
  console.error(err.stderr.toString());
  throw err;
}
function modify(path, modifyFn) {
  const content = readFileSync(path, 'utf8');
  writeFileSync(path, modifyFn(content));
}
modify(
  'types/compiler/index.d.ts',
  content => content + '\nexport * from "./interfaces"'
);

